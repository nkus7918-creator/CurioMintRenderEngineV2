export type MapMarker = {
    id: string;
    label: string;
  
    // Harita üzerindeki yüzde konumu.
    x: number;
    y: number;
  };
  
  export type AnimatedMapConfig = {
    title?: string;
    subtitle?: string;
    markers: MapMarker[];
    mapStyle?: "political" | "relief" | "blank";
  };