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
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  role: string;
}

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const router = useRouter();

  // Dialog state and fields for adding a new employee
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    id: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    role: "",
  });

  // Fetch employees from Firestore
  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "businessEmployees"));
      const fetched: Employee[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Employee, "id">;
        fetched.push({ id: docSnap.id, ...data });
      });
      setEmployees(fetched);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Improved Employee ID Generation
  const generateEmployeeId = () => {
    let maxSeq = 0;
    employees.forEach((emp) => {
      const match = emp.id.match(/ROC-(\d{3})/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    return `ROC-${(maxSeq + 1).toString().padStart(3, "0")}`;
  };

  // Handle adding a new employee: save to Firestore then update local state
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeId = generateEmployeeId();
      const employeeToAdd = {
        employeeId: employeeId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        idNumber: newEmployee.idNumber,
        role: newEmployee.role,
      };
      const docRef = await addDoc(
        collection(db, "businessEmployees"),
        employeeToAdd
      );
      // Here we use Firestore's generated id for now, or you can update it later with employeeId.
      const newEmp: Employee = { id: employeeId, ...employeeToAdd };
      setEmployees((prev) => [...prev, newEmp]);
      setNewEmployee({
        id: "",
        firstName: "",
        lastName: "",
        idNumber: "",
        role: "",
      });
      setDialogOpen(false);
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
    router.push(`/business/employee-management/${id}`);
  };

  return (
    <section className="p-4 shadow rounded bg-white space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <p className="text-muted-foreground">
          Add, remove, or edit your employees' details.
        </p>
      </div>

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
            <Button>Add Employee</Button>
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
                <Button type="submit">Save Employee</Button>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              <TableRow
                key={emp.id}
                onClick={() => handleRowClick(emp.id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <TableCell>{emp.id}</TableCell>
                <TableCell>
                  {emp.firstName} {emp.lastName}
                </TableCell>
                <TableCell>{emp.idNumber}</TableCell>
                <TableCell>{emp.role}</TableCell>
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
