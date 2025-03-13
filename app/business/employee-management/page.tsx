//app/business/employee-management/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { collection, getDocs, addDoc, getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";
import { useAuth } from "@/context/auth-context";
import { addEmployee, fetchEmployees } from "@/lib/employee-utils";
import { Separator } from "@/components/ui/separator";
import { set } from "date-fns";
import { Loader2 } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  role: string;
}

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const [merchantCode, setMerchantCode] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingEmployee, setSavingEmployee] = useState(false);

  // Dialog state and fields for adding a new employee
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    id: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    role: "",
  });

 

  useEffect(() => {
    if (!user) return;
  
    const loadEmployees = async () => {
      try {
        const userDoc = await getDocs(collection(db, "users"));
        const userData = userDoc.docs.find((doc) => doc.id === user.uid)?.data();
  
        if (!userData || !userData.merchantCode) {
          console.error("Merchant code not found.");
          return;
        }
  
        setMerchantCode(userData.merchantCode);
  
        // Fetch merchant data to get company name
        const merchantDoc = await getDoc(doc(db, "merchants", userData.merchantCode));
        const merchantData = merchantDoc.data();
        const companyName = merchantData?.companyName || "ROC";
        
        // Fetch Employees
        const employeesData = await fetchEmployees(userData.merchantCode);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error loading employees:", error);
      } finally {
        setLoading(false);
      }
    };
  
    loadEmployees();
  }, [user]);

  // Improved Employee ID Generation
  const generateEmployeeId = (companyName : any) => {
    // Get first 3 letters of company name and capitalize them
    const prefix = companyName.substring(0, 3).toUpperCase();
    
    // Find highest sequence number
    let maxSeq = 0;
    employees.forEach((emp) => {
      const match = emp.id.match(/[A-Z]{3}-(\d{3})/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    
    // Format: [3 letters]-[3 digit number]
    return `${prefix}-${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  // Handle adding a new employee: save to Firestore then update local state
  const handleAddEmployee = async (e: React.FormEvent) => {
    setSavingEmployee(true);
    e.preventDefault();
    if (!merchantCode) return;
  
    try {
      // Get company name for ID generation
      const merchantDoc = await getDoc(doc(db, "merchants", merchantCode));
      const merchantData = merchantDoc.data();
      const companyName = merchantData?.companyName || "ROC";
      
      // Generate employee ID
      const employeeId = generateEmployeeId(companyName);
      
      // Add the employee with the generated ID
      const addedEmployee = await addEmployee(merchantCode, {
        id: employeeId, // Use the generated ID
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        idNumber: newEmployee.idNumber,
        role: newEmployee.role,
        age: "",
        gender: "",
        dateOfHire: "",
        phoneNumber: "",
        email: "",
        address: ""
      });
  
      if (addedEmployee) {
        setEmployees((prev) => [...prev, addedEmployee]);
        setNewEmployee({
          id: "",
          firstName: "",
          lastName: "",
          idNumber: "",
          role: "",
        });
        setSavingEmployee(false);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };
  

  // Filter employees by first and last name
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      `${emp.firstName} ${emp.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, currentPage]);

  const handleRowClick = (id: string) => {
    if (!id) {
      console.error("Employee ID is undefined");
      return;
    }
    router.push(`/business/employee-management/${id}`);
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <p className="text-muted-foreground">
          Add, remove, or edit your employees' details.
        </p>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-1/2"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter employee details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="firstName"
                  className="col-span-1 text-sm font-medium"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={newEmployee.firstName}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      firstName: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="lastName"
                  className="col-span-1 text-sm font-medium"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={newEmployee.lastName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, lastName: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="idNumber"
                  className="col-span-1 text-sm font-medium"
                >
                  ID Number
                </Label>
                <Input
                  id="idNumber"
                  value={newEmployee.idNumber}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, idNumber: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="role"
                  className="col-span-1 text-sm font-medium"
                >
                  Role
                </Label>
                <Input
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <DialogFooter>
              <Button type="submit" disabled={savingEmployee}>
                {savingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Employee
              </Button>

                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>ID Number</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedEmployees.length ? (
            paginatedEmployees.map((emp) => (
              <TableRow key={emp.id} onClick={() => handleRowClick(emp.id)} className="cursor-pointer">
                <TableCell>{emp.id}</TableCell>
                <TableCell>{`${emp.firstName} ${emp.lastName}`}</TableCell>
                <TableCell>{emp.idNumber || "N/A"}</TableCell>
                <TableCell>{emp.role || "N/A"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24">
                No employees found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>


      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
