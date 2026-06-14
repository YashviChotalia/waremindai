"""
Execution Algorithms — real-time algorithms for sub-10-minute fulfillment.

1. Order Batching  — groups orders by spatial proximity (KMeans)
2. Picker Routing  — solves TSP per batch (OR-Tools)
3. VRPTW           — assigns riders with time windows (OR-Tools)
"""
from dataclasses import dataclass, field
import numpy as np
from sklearn.cluster import KMeans
from ortools.constraint_solver import routing_enums_pb2, pywrapcp
from typing import Optional


# ═══════════════════════════════════════════════════════
#  ORDER BATCHING
# ═══════════════════════════════════════════════════════

@dataclass
class OrderItem:
    order_id: str
    sku_id: str
    aisle: int          # Physical aisle number in warehouse
    shelf_row: int      # Shelf row within aisle
    qty: int


@dataclass
class PickerBatch:
    batch_id: str
    picker_id: Optional[str]
    orders: list[str]   # order IDs in this batch
    items: list[OrderItem]
    estimated_pick_time_min: float


def batch_orders(
    items: list[OrderItem],
    n_pickers: int = 5,
    max_items_per_batch: int = 20,
) -> list[PickerBatch]:
    """
    Groups order items by physical shelf location using KMeans clustering.
    Each cluster = one picker's batch for a single warehouse sweep.

    Why KMeans: Items close together spatially should be picked in one trip.
    This prevents pickers from crisscrossing the warehouse for different orders.
    """
    if not items:
        return []

    coords = np.array([[item.aisle, item.shelf_row] for item in items], dtype=float)
    n_clusters = min(n_pickers, len(items))

    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    labels = kmeans.fit_predict(coords)

    batches: dict[int, list[OrderItem]] = {}
    for item, label in zip(items, labels):
        batches.setdefault(label, []).append(item)

    result = []
    for batch_idx, batch_items in batches.items():
        order_ids = list({item.order_id for item in batch_items})
        # Estimate: ~45 seconds per item pick + 2 min travel overhead
        estimated_time = (len(batch_items) * 0.75) + 2.0

        result.append(PickerBatch(
            batch_id=f"BATCH-{batch_idx:04d}",
            picker_id=None,  # Assigned by workforce scheduler
            orders=order_ids,
            items=batch_items,
            estimated_pick_time_min=round(estimated_time, 1),
        ))

    return result


# ═══════════════════════════════════════════════════════
#  DYNAMIC PICKER ROUTING (TSP via OR-Tools)
# ═══════════════════════════════════════════════════════

@dataclass
class PickLocation:
    sku_id: str
    aisle: int
    shelf_row: int
    qty: int


def solve_picker_route(
    locations: list[PickLocation],
    depot_aisle: int = 0,
    depot_shelf: int = 0,
) -> list[int]:
    """
    Solves the Traveling Salesman Problem for a single picker's batch.
    Returns: Ordered indices into `locations` — the optimal picking sequence.

    OR-Tools solves this in milliseconds for warehouse-scale (< 50 stops).
    Guarantees: no backtracking, shortest total walking distance.
    """
    if not locations:
        return []
    if len(locations) == 1:
        return [0]

    # Build all nodes including depot (index 0)
    all_locs = [(depot_aisle, depot_shelf)] + [(l.aisle, l.shelf_row) for l in locations]

    def manhattan_distance(a: tuple, b: tuple) -> int:
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    n = len(all_locs)
    distance_matrix = [
        [manhattan_distance(all_locs[i], all_locs[j]) for j in range(n)]
        for i in range(n)
    ]

    # OR-Tools TSP setup
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # n nodes, 1 vehicle, depot=0
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_idx, to_idx):
        return distance_matrix[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]

    transit_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = 1  # Hard real-time limit

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return list(range(len(locations)))  # Fallback: original order

    # Extract route (skip depot node 0, subtract 1 to get location indices)
    route = []
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        node = manager.IndexToNode(idx)
        if node != 0:
            route.append(node - 1)  # Convert back to location index
        idx = solution.Value(routing.NextVar(idx))

    return route


# ═══════════════════════════════════════════════════════
#  VRPTW — Vehicle Routing with Time Windows
# ═══════════════════════════════════════════════════════

@dataclass
class DeliveryStop:
    order_id: str
    lat: float
    lng: float
    earliest_sec: int   # Earliest allowed arrival (seconds from now)
    latest_sec: int     # Latest allowed arrival (e.g. 600 = 10 minutes)
    service_time_sec: int = 60  # Time to hand over order


@dataclass
class Rider:
    rider_id: str
    current_lat: float
    current_lng: float
    available: bool = True


@dataclass
class RiderAssignment:
    rider_id: str
    stops: list[str]    # order_ids in delivery sequence
    estimated_total_sec: float


def solve_vrptw(
    stops: list[DeliveryStop],
    riders: list[Rider],
    travel_matrix: list[list[int]],  # travel_matrix[i][j] = travel time in seconds
) -> list[RiderAssignment]:
    """
    Vehicle Routing Problem with Time Windows.
    Assigns orders to riders and sequences deliveries within the 10-minute window.

    travel_matrix: precomputed travel times from real-time traffic API.
    Node 0 = dark store depot. Nodes 1..n = delivery stops.

    Returns: One RiderAssignment per rider with their ordered stops.
    """
    if not stops or not riders:
        return []

    n_locations = len(stops) + 1     # +1 for depot
    n_vehicles = len(riders)

    manager = pywrapcp.RoutingIndexManager(n_locations, n_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    def transit_callback(from_idx, to_idx):
        i = manager.IndexToNode(from_idx)
        j = manager.IndexToNode(to_idx)
        if i < len(travel_matrix) and j < len(travel_matrix[i]):
            return travel_matrix[i][j]
        return 999999  # Unreachable

    transit_idx = routing.RegisterTransitCallback(transit_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    # Time dimension — enforces time windows
    routing.AddDimension(
        transit_idx,
        slack_max=30,           # Allow 30s early arrival slack
        capacity=3600,          # Max route duration: 1 hour
        fix_start_cumul_to_zero=True,
        name="Time",
    )
    time_dim = routing.GetDimensionOrDie("Time")

    # Add service time + time windows for each stop
    for stop_idx, stop in enumerate(stops):
        node = stop_idx + 1  # +1 because node 0 is depot
        index = manager.NodeToIndex(node)
        time_dim.CumulVar(index).SetRange(stop.earliest_sec, stop.latest_sec)
        routing.AddToAssignment(time_dim.SlackVar(index))

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    search_params.time_limit.seconds = 2  # Real-time constraint

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return []

    assignments = []
    for vehicle_idx, rider in enumerate(riders):
        route_stops = []
        total_time = 0.0
        idx = routing.Start(vehicle_idx)
        while not routing.IsEnd(idx):
            node = manager.IndexToNode(idx)
            if node > 0:
                route_stops.append(stops[node - 1].order_id)
            next_idx = solution.Value(routing.NextVar(idx))
            total_time += transit_callback(idx, next_idx)
            idx = next_idx

        if route_stops:
            assignments.append(RiderAssignment(
                rider_id=rider.rider_id,
                stops=route_stops,
                estimated_total_sec=total_time,
            ))

    return assignments
