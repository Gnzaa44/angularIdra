
export interface Product {
    id: string;
    name: string;
    data: {
      color?: string;
      capacity?: string;
      price?: string;
    };
    isLocallyAdded?: boolean; 
  }