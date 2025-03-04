"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import UploadDocumentsSection from "./upload-document/upload-document";
import AccountingSection from "./accounting/accounting";
import { Separator } from "@/components/ui/separator";

export interface ProjectDetail {
  id: string;
  typeOfWork: string;
  registrationNumber: string;
  vehicleType: string;
  location: string;
  projectDescription: string;
  partners: string;
  fleetNumber: string;
}

interface ProjectDetailFormProps {
  project: ProjectDetail;
  onSave: (project: ProjectDetail) => void;
  onSubmit: (project: ProjectDetail) => void;
  onCancel: () => void;
}

// Helper component to display a label with a red "*" if the value is empty.
const LabelWithAsterisk: React.FC<{
  htmlFor: string;
  label: string;
  value?: string;
}> = ({ htmlFor, label, value = "" }) => (
  <Label htmlFor={htmlFor} className="block text-sm font-medium">
    {label} {value.trim() === "" && <span className="text-red-600">*</span>}
  </Label>
);

export const ProjectDetailForm: React.FC<ProjectDetailFormProps> = ({
  project: initialProject,
  onSave,
  onSubmit,
  onCancel,
}) => {
  const [project, setProject] = useState<ProjectDetail>(initialProject);

  // Auto-generate the Project ID based on the registration number.
  useEffect(() => {
    const prefix = project.registrationNumber.slice(0, 6).toUpperCase();
    // For demonstration, assume sequence "001"
    const sequence = "001";
    const generatedId = `${prefix}-${sequence}`;
    setProject((prev) => ({ ...prev, id: generatedId }));
  }, [project.registrationNumber]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className="space-y-6 p-4">
      {/* Header Summary */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{project.registrationNumber}</h1>
        <div className="flex ">
          <p className="text-muted-foreground">{project.vehicleType} • </p>
          <p className="text-muted-foreground font-bold">{project.location}</p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Project Information Section */}
      <div>
        <h2 className="text-xl font-bold mb-2">Project Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="id" className="block text-sm font-medium">
              Project ID
            </Label>
            <Input
              id="id"
              name="id"
              value={project.id}
              readOnly
              className="mt-1"
            />
          </div>
          <div>
            <LabelWithAsterisk
              htmlFor="partners"
              label="Partners"
              value={project.partners}
            />
            <Input
              id="partners"
              name="partners"
              value={project.partners}
              onChange={handleChange}
              placeholder="Enter partners separated by commas"
              className="mt-1"
            />
          </div>
          <div>
            <LabelWithAsterisk
              htmlFor="typeOfWork"
              label="Type of work"
              value={project.typeOfWork}
            />
            <Input
              id="typeOfWork"
              name="typeOfWork"
              value={project.typeOfWork}
              onChange={handleChange}
              placeholder="Enter type of work"
              className="mt-1"
            />
          </div>
          <div className="">
            <LabelWithAsterisk
              htmlFor="projectDescription"
              label="Project Description"
              value={project.projectDescription}
            />
            <textarea
              id="projectDescription"
              name="projectDescription"
              value={project.projectDescription}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Vehicle Details Section */}
      <div>
        <h2 className="text-xl font-bold mb-2">Vehicle Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <LabelWithAsterisk
              htmlFor="registrationNumber"
              label="Registration Number"
              value={project.registrationNumber}
            />
            <Input
              id="registrationNumber"
              name="registrationNumber"
              value={project.registrationNumber}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <LabelWithAsterisk
              htmlFor="vehicleType"
              label="Vehicle Type"
              value={project.vehicleType}
            />
            <Input
              id="vehicleType"
              name="vehicleType"
              value={project.vehicleType}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <LabelWithAsterisk
              htmlFor="location"
              label="Location"
              value={project.location}
            />
            <Input
              id="location"
              name="location"
              value={project.location}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <LabelWithAsterisk
              htmlFor="fleetNumber"
              label="Fleet Number"
              value={project.fleetNumber}
            />
            <Input
              id="fleetNumber"
              name="fleetNumber"
              value={project.fleetNumber}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Upload Documents Section */}
      <div>
        <UploadDocumentsSection projectId={project.id} />
      </div>

      <Separator className="my-4" />

      {/* Accounting Section */}
      <div>
        <AccountingSection projectId={project.id} />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={() => onSave(project)}
        >
          Save
        </Button>
        <Button
          variant="default"
          type="button"
          onClick={() => onSubmit(project)}
        >
          Submit
        </Button>
      </div>
    </form>
  );
};

export default ProjectDetailForm;
