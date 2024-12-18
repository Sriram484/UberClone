import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useLocationStore, useDriverStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const Map = () => {
  const {
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude,
  } = useLocationStore();
  const { data: drivers, loading, error } = useFetch<Driver>("/(api)/driver");

  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const region = calculateRegion({
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude,
  });

  useEffect(() => {
    setDrivers(drivers)
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) {
        return;
      }
      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers]);

  useEffect(() => {
    if (
        markers.length > 0 &&
        destinationLatitude !== undefined &&
        destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLongitude,
        userLatitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, []);



  if (loading || !userLatitude || !userLongitude) {
    return (
        <View className="flex justify-between items-center w-full">
          <ActivityIndicator size="small" color="#000" />
        </View>
    );
  }

  if (error) {
    return (
        <View className="flex justify-between items-center w-full">
          <Text>Error: {error}</Text>
        </View>
    );
  }

  return (
      <MapView
          provider={PROVIDER_DEFAULT}
          className="w-full h-full rounded-2xl"
          tintColor="black"
          mapType="mutedStandard"
          showsPointsOfInterest={false}
          initialRegion={region}
          showsUserLocation={true}
          userInterfaceStyle={"dark"}
      >
        {markers.map((marker) => (
            <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                image={
                  selectedDriver === marker.id ? icons.selectedMarker : icons.marker
                }
            ></Marker>
        ))}
      </MapView>
  );
};

export default Map;
