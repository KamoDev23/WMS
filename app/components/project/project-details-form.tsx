"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Import the Checkbox from shadcn
import UploadDocumentsSection from "./documents/upload-document";
import AccountingSection from "./accounting/accounting";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCustomToast } from "../customs/toast";
import { toast } from "sonner";
// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HouseIcon, PanelsTopLeftIcon, BoxIcon, HomeIcon, Plus, Clipboard, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/firebase/firebase-config";
import { doc, updateDoc } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import ProjectProgress from "./components/project-progress";
import QuoteCreatorPage from "./quotes2/quote-builder";
  
export interface ProjectDetail {
  id: string;
  typeOfWork: string;
  registrationNumber: string;
  vehicleType: string;
  location: string;
  projectDescription: string;
  partners: string;
  fleetNumber: string;
  status: string; // e.g. "open", "closed", "cancelled"
  cancellationReason?: string;
  odometerReading: number;
  workCompleted?: boolean; // New field to track if repairs/tires have been completed
  notes?: { id: string; content: string; createdAt: string; createdBy?: string }[]; // Added notes array
}

interface ProjectDetailFormProps {
  project: ProjectDetail;
  onSave?: (project: ProjectDetail) => void;
  onCancel: () => void;
}

const LabelWithAsterisk: React.FC<{
  htmlFor: string;
  label: string;
  value?: string;
}> = ({ htmlFor, label, value = "" }) => (
  <Label htmlFor={htmlFor} className="block text-sm font-medium">
    {label} {value.trim() === "" && <span className="text-red-600">*</span>}
  </Label>
);

// Helper to get badge classes based on status.
const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "closed":
      return "bg-green-100 text-green-800 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export const ProjectDetailForm: React.FC<ProjectDetailFormProps> = ({
  project: initialProject,
  onSave,
  onCancel,
}) => {
  const [project, setProject] = useState<ProjectDetail>(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseOptions, setShowCloseOptions] = useState(false);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingCancellation, setIsConfirmingCancellation] = useState(false);
  
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const showToast = useCustomToast();

  // Fetch merchant code from the user document.
  useEffect(() => {
    if (!user) return;
    const fetchMerchantCode = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, "users"));
        const userData = userSnapshot.docs.find(doc => doc.id === user.uid)?.data();
        if (userData && userData.merchantCode) {
          setMerchantCode(userData.merchantCode);
        } else {
          console.error("Merchant code not found for this user.");
        }
      } catch (error) {
        console.error("Error fetching merchant code:", error);
      }
    };
    fetchMerchantCode();
  }, [user]);

  // Auto-generate the Project ID based on the registration number.
  useEffect(() => {
    const prefix = project.registrationNumber.slice(0, 6).toUpperCase();
    const sequence = "001"; // For demonstration, using a static sequence.
    const generatedId = `${prefix}-${sequence}`;
    setProject((prev) => ({ ...prev, id: generatedId }));
  }, [project.registrationNumber]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  // Updated to use new database directory: merchants/{merchantCode}/projects/{project.id}
  const handleSaveProject = async () => {
    if (!merchantCode) return;
    setIsSaving(true);
    try {
      const projectRef = doc(db, "merchants", merchantCode, "projects", project.id);
      // Update the project document with the new values.
      await updateDoc(projectRef, {
        typeOfWork: project.typeOfWork || "",
        registrationNumber: project.registrationNumber || "",
        vehicleType: project.vehicleType || "",
        location: project.location || "",
        projectDescription: project.projectDescription || "",
        partners: project.partners || "",
        fleetNumber: project.fleetNumber || "",
        status: project.status || "",
        workCompleted: project.workCompleted || false, // Save the workCompleted state
        odometerReading: project.odometerReading || 0,
        notes: project.notes || [],
      });
      toast.success("Project updated successfully!");
      if (onSave) onSave(project);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  // Updated to use new directory.
  const handleProjectComplete = async () => {
    if (!merchantCode) return;
    setIsSaving(true);
    try {
      const projectRef = doc(db, "merchants", merchantCode, "projects", project.id);
      await updateDoc(projectRef, {
        status: "Closed",
      });
      toast.success("Project marked as complete and closed.");
      setProject((prev) => ({ ...prev, status: "Closed" }));
    } catch (error) {
      console.error("Error marking project as complete:", error);
      toast.error("Failed to mark project as complete.");
    } finally {
      setIsSaving(false);
      setShowCloseModal(false);
    }
  };

  // Updated to use new directory.
  const handleConfirmCancellation = async () => {
    if (!merchantCode) return;
    setIsConfirmingCancellation(true);
    try {
      console.log("Project cancelled with reason:", cancelReason);
      const projectRef = doc(db, "merchants", merchantCode, "projects", project.id);
      await updateDoc(projectRef, {
        status: "Cancelled",
        cancellationReason: cancelReason,
      });
      toast.success("Project cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling project:", error);
      toast.error("Failed to cancel project");
    } finally {
      setIsConfirmingCancellation(false);
      setShowCancelReasonModal(false);
    }
  };

  const handleProjectClosed = () => {
    setShowCloseModal(true);
  };

  const handleProjectCancelled = () => {
    setShowCancelReasonModal(true);
    setShowCloseOptions(false);
  };

  // Check if the work type is repair or tyre related
  const isRepairOrTyreWork = () => {
    const workType = project.typeOfWork.toLowerCase();
    return workType.includes("repair") || workType.includes("tyre") || workType.includes("tire");
  };

  // Get appropriate label for the checkbox based on work type
  const getWorkCompletedLabel = () => {
    const workType = project.typeOfWork.toLowerCase();
    if (workType.includes("tyre") || workType.includes("tire")) {
      return "Tyres have been fitted";
    }
    return "Vehicle has been repaired";
  };

  return (
    <form className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-col space-y-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <HomeIcon size={16} aria-hidden="true" />
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator className="mb-6" />

      {/* Header Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{project.registrationNumber}</h1>
          <div className="flex items-center space-x-2">
            <p className="text-muted-foreground">{project.vehicleType}</p>
            <p>•</p>
            <p className="text-muted-foreground font-bold">{project.location}</p>
            <p>•</p>
            <Badge variant="outline" className={getStatusBadgeClass(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
        <div className="flex justify-end space-x-4 relative">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  setProject(initialProject);
                  setIsEditing(false);
                 }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" type="button">
                Close Project
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProjectClosed}>
                Project Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProjectCancelled}>
                Project Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col h-full">
        <Tabs defaultValue="overview" className="flex flex-col flex-1">
          <TabsList className="flex w-full text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
            <TabsTrigger
              value="overview"
              className="flex-1 text-center hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <HouseIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="documentation"
              className="flex-1 text-center hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <PanelsTopLeftIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
              Documents
            </TabsTrigger>
            {/* <TabsTrigger
              value="quotes"
              className="flex-1 text-center hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <BoxIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
              Quotation & Invoicing
            </TabsTrigger> */}
            <TabsTrigger
              value="accounting"
              className="flex-1 text-center hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <BoxIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
              Accounting
            </TabsTrigger>
            
          </TabsList>

          <TabsContent value="overview">
            <div className="mb-4 grid grid-cols-3 gap-6">
              {/* Project Information Section spanning 2 columns */}
              <div className="col-span-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg ">
                        <span>Project Information</span> 
                      </CardTitle>
                    </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="id" className="block text-sm font-medium">
                              Project ID
                            </Label>
                            <Input id="id" name="id" value={project.id} readOnly className="mt-1" />
                          </div>
                          <div>
                            <LabelWithAsterisk htmlFor="partners" label="Partners" value={project.partners} />
                            <Input
                              id="partners"
                              name="partners"
                              value={project.partners}
                              onChange={handleChange}
                              placeholder="Enter partners separated by commas"
                              className="mt-1"
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <LabelWithAsterisk htmlFor="typeOfWork" label="Type of work" value={project.typeOfWork} />
                            <Input
                              id="typeOfWork"
                              name="typeOfWork"
                              value={project.typeOfWork}
                              onChange={handleChange}
                              placeholder="Enter type of work"
                              className="mt-1"
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <LabelWithAsterisk htmlFor="location" label="Location" value={project.location} />
                            <Input
                              id="location"
                              name="location"
                              value={project.location}
                              onChange={handleChange}
                              placeholder="Enter location"
                              className="mt-1"
                              disabled={!isEditing}
                            />
                          </div>
                        <div>
                    
                    </div>
                    <div>
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
                        disabled={!isEditing}
                      />
                    </div>
                    {project.status.toLowerCase() === "cancelled" && (
                      <div className="col-span-1">
                        <Label htmlFor="cancellationReason" className="block text-sm font-medium">
                          Cancellation Reason
                        </Label>
                        <Textarea
                          id="cancellationReason"
                          name="cancellationReason"
                          value={project.cancellationReason || ""}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                    )}
                        </div>

                        <Separator className="mt-6 mb-4" />

                        {/* Vehicle Details Section */}
                        <div className="mb-6">
                          <h2 className="text-md font-bold mb-4">Vehicle Details</h2>
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
                                disabled={!isEditing}
                              />
                            </div>
                            <div>
                              <LabelWithAsterisk htmlFor="vehicleType" label="Vehicle Type" value={project.vehicleType} />
                              <Input
                                id="vehicleType"
                                name="vehicleType"
                                value={project.vehicleType}
                                onChange={handleChange}
                                className="mt-1"
                                disabled={!isEditing}
                              />
                            </div>
                            <div>
                              <LabelWithAsterisk htmlFor="location" label="Location" value={project.location} />
                              <Input
                                id="location"
                                name="location"
                                value={project.location}
                                onChange={handleChange}
                                className="mt-1"
                                disabled={!isEditing}
                              />
                            </div>
                            <div>
                              <LabelWithAsterisk htmlFor="fleetNumber" label="Fleet Number" value={project.fleetNumber} />
                              <Input
                                id="fleetNumber"
                                name="fleetNumber"
                                value={project.fleetNumber}
                                onChange={handleChange}
                                className="mt-1"
                                disabled={!isEditing}
                              />
                            </div>
                            <div>
                              <LabelWithAsterisk htmlFor="odometerReading" label="Odometer reading" value={project.odometerReading.toString()} />
                              <Input
                                id="odometerReading"
                                name="odometerReading"
                                value={project.odometerReading.toString()}
                                type="number"
                                onChange={handleChange}
                                className="mt-1"
                                disabled={!isEditing}
                              />
                            </div>
                            
                            {/* Conditional Work Completion Checkbox */}
                            {isRepairOrTyreWork() && (
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2 mt-4">
                                  <Checkbox 
                                    id="workCompleted" 
                                    checked={project.workCompleted || false}
                                    onCheckedChange={(checked) => {
                                      setProject(prev => ({ ...prev, workCompleted: checked === true }));
                                    }}
                                    disabled={!isEditing}
                                  />
                                  <Label 
                                    htmlFor="workCompleted" 
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {getWorkCompletedLabel()}
                                  </Label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="mt-6 mb-4" />

                        {/* Notes Section */}

                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-md font-bold">Project Notes</h2>
                            {isEditing && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Add a new note with timestamp
                                  const newNote = {
                                    id: Date.now().toString(),
                                    content: "",
                                    createdAt: new Date().toISOString(),
                                   };
                                  setProject(prev => ({
                                    ...prev,
                                    notes: [...(prev.notes || []), newNote]
                                  }));
                                }}
                                className="flex items-center gap-1"
                              >
                                <Plus />
                                Add Note
                              </Button>
                            )}
                          </div>

                          {/* Notes List */}
                          {(!project.notes || project.notes.length === 0) ? (
                            <Card>
                              <CardContent className="p-4">
                              <div className="flex flex-col items-center justify-center ">
                                <Clipboard />
                                <p>No notes have been added to this project yet.</p>
                                 
                              </div></CardContent>
                            </Card>
                          ) : (
                            <div className="space-y-4">
                              {project.notes.map((note, index) => (
                                <Card key={note.id || index} className="shadow-sm">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center text-sm "> 
                                         <span className="mx-2">•</span>
                                        <span>
                                          {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {isEditing && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            // Remove this note
                                            setProject(prev => ({
                                              ...prev,
                                              notes: prev.notes?.filter((n, i) => n.id !== note.id) || []
                                            }));
                                          }}
                                        >
                                          <Trash />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {isEditing ? (
                                      <Textarea
                                        value={note.content}
                                        onChange={(e) => {
                                          // Update the note content
                                          setProject(prev => ({
                                            ...prev,
                                            notes: prev.notes?.map((n) => 
                                              n.id === note.id ? { ...n, content: e.target.value } : n
                                            ) || []
                                          }));
                                        }}
                                        placeholder="Enter note details here..."
                                        className="mt-1 w-full"
                                        rows={3}
                                      />
                                    ) : (
                                      <div className="whitespace-pre-wrap mt-2 ">
                                        {note.content || <span className="italic ">No content</span>}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                    </CardContent>
                    </Card>
                   
                  
                </div>

                
              </div>

              {/* Project Progress Section taking 1 column */}
              <div className="col-span-1">
                <ProjectProgress projectId={project.id} />
              </div>
            </div>
          </TabsContent> 
          <TabsContent value="documentation" className="flex-1 overflow-auto">
            <UploadDocumentsSection projectId={project.id} />
          </TabsContent>
          {/* <TabsContent value="quotes" className="flex-1 overflow-auto">
            <QuoteCreatorPage/>
          </TabsContent> */}
          <TabsContent value="accounting" className="flex-1 overflow-auto">
            <AccountingSection projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Close project Modal */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to close the project?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleProjectComplete}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Reason Modal */}
      <Dialog open={showCancelReasonModal} onOpenChange={setShowCancelReasonModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Cancelled</DialogTitle>
            <DialogDescription>
              Please provide the reason for cancellation:
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation"
            className="mt-2"
          />
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowCancelReasonModal(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmCancellation}
              disabled={isConfirmingCancellation}
            >
              {isConfirmingCancellation ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ProjectDetailForm;