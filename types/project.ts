export interface Project {
    id: string;
    registrationNumber: string;
    vehicleType: string;
    typeOfWork: string;
    location: string;
    dateOpened: string;
    dateClosed?: string;
    status: string;
    odometerReading: number;
    isBacklog?: boolean;
  }
  