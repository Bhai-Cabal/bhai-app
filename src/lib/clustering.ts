interface ClusteredMarker {
  lat: number;
  lng: number;
  points: any[];
}

export function clusterMarkers(markers: any[], radius: number = 40): ClusteredMarker[] {
  const clusters: ClusteredMarker[] = [];
  const pixelToLatLng = 0.01; // Approximate conversion for clustering radius

  markers.forEach((marker) => {
    const markerLat = marker.location.lat;
    const markerLng = marker.location.lng;
    let foundCluster = false;

    for (const cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow((markerLat - cluster.lat) * 111, 2) +
        Math.pow((markerLng - cluster.lng) * 111 * Math.cos(markerLat * (Math.PI / 180)), 2)
      ) * 1000; // Convert to meters

      if (distance < radius * pixelToLatLng) {
        cluster.points.push(marker);
        cluster.lat = cluster.points.reduce((sum, p) => sum + p.location.lat, 0) / cluster.points.length;
        cluster.lng = cluster.points.reduce((sum, p) => sum + p.location.lng, 0) / cluster.points.length;
        foundCluster = true;
        break;
      }
    }

    if (!foundCluster) {
      clusters.push({
        lat: markerLat,
        lng: markerLng,
        points: [marker]
      });
    }
  });

  return clusters;
}
