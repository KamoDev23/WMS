"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
 import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCustomToast } from "../../customs/toast";
   
export interface CreateProjectModalProps {
  onCreate: (project: NewProject) => Promise<void>;
  onClose: () => void;
}

export interface NewProject {
  registrationNumber: string;
  location: string;
  odometerReading: number;
  vehicleType: string;
  typeOfWork: string;
  status: "open" | "closed";
}

const vehicleTypes: string[] = [
  "Grader",
  "TLB",
  "Frontend Loader",
  "Dozer",
  "Excavator",
  "Tipper Truck",
  "Flat-bed Truck",
  "Hooklift",
  "Low-bed Trailer",
  "Transporter Truck",
  "Grader Unit",
  "LDV Bakkie",
  "Panel-van",
  "Mini Panel-van",
];

const typeOfWorkOptions: string[] = ["Tyres", "Repairs"];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onCreate,
  onClose,
}) => {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [location, setLocation] = useState("");
  const [odometerReading, setOdometerReading] = useState<number>(0);
  const [vehicleType, setVehicleType] = useState<string>(vehicleTypes[0]);
  const [typeOfWork, setTypeOfWork] = useState<string>(typeOfWorkOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  const showToast = useCustomToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create new project object with a default status of "open"
    const newProject: NewProject = {
      registrationNumber,
      location,
      odometerReading,
      vehicleType,
      typeOfWork,
      status: "open",
    };
    
    try {
      // Wait for the project creation to complete
      await onCreate(newProject);
      
      // Show a success toast using sonner
      toast.success("Project Created", {
        description: `Project for ${registrationNumber} was created successfully.`,
        duration: 5000,
      });
 
      
      // Clear fields
      setRegistrationNumber("");
      setLocation("");
      setOdometerReading(0);
      setVehicleType(vehicleTypes[0]);
      setTypeOfWork(typeOfWorkOptions[0]);
      
      // Close the modal after a short delay to allow the user to see the loading state finish
      setTimeout(() => {
        setIsModalOpen(false);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error("Error creating project:", error);
      // Show an error toast
      toast.error("Error", {
        description: "There was an error creating the project.",
        duration: 5000,
      });
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      onClose();
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a new project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registrationNumber" className="text-right">
              Vehicle Registration Number
            </Label>
            <Input
              id="registrationNumber"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="col-span-3"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Vehicle Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="odometer" className="text-right">
              Odometer Reading
            </Label>
            <Input
              id="odometer"
              type="number"
              value={odometerReading}
              onChange={(e) => setOdometerReading(parseFloat(e.target.value))}
              className="col-span-3"
              required
              disabled={isSubmitting}
            />
          </div>
          {/* Vehicle Type using Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicleType" className="text-right">
              Vehicle Type
            </Label>
            <Select 
              value={vehicleType} 
              onValueChange={setVehicleType} 
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* Type of Work using Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="typeOfWork" className="text-right">
              Type of Work
            </Label>
            <Select 
              value={typeOfWork} 
              onValueChange={setTypeOfWork}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type of work" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {typeOfWorkOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;