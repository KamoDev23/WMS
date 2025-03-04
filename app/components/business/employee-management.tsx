"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase-config";

export interface Employee {
  id: string;
  name: string;
  role: string;
  contractDetails: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    id: "",
    name: "",
    role: "",
    contractDetails: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const querySnapshot = await getDocs(
          collection(db, "businessEmployees")
        );
        const fetched: Employee[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Employee);
        });
        setEmployees(fetched);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    }
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.contractDetails.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const handleAddEmployee = async () => {
    if (newEmployee.name && newEmployee.role) {
      try {
        const docRef = await addDoc(collection(db, "businessEmployees"), {
          name: newEmployee.name,
          role: newEmployee.role,
          contractDetails: newEmployee.contractDetails,
        });
        setEmployees((prev) => [...prev, { ...newEmployee, id: docRef.id }]);
        setNewEmployee({ id: "", name: "", role: "", contractDetails: "" });
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error adding employee:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "businessEmployees", id));
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  return (
    <div className="p-4   shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Employee Management</h2>
        <Button onClick={() => setIsModalOpen(true)} className="px-4 py-2  ">
          Add Employee
        </Button>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Contract Details</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((emp) => (
            <tr key={emp.id} className="text-center">
              <td className="border p-2">{emp.id}</td>
              <td className="border p-2">{emp.name}</td>
              <td className="border p-2">{emp.role}</td>
              <td className="border p-2">{emp.contractDetails}</td>
              <td className="border p-2 space-x-2">
                <Button variant="outline" size="sm">
                  View
                </Button>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(emp.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center   bg-opacity-50">
          <div className=" rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Employee</h3>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="newEmployeeName"
                  className="block text-sm font-medium"
                >
                  Name
                </Label>
                <Input
                  id="newEmployeeName"
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <Label
                  htmlFor="newEmployeeRole"
                  className="block text-sm font-medium"
                >
                  Role
                </Label>
                <Input
                  id="newEmployeeRole"
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value })
                  }
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <Label
                  htmlFor="newEmployeeContract"
                  className="block text-sm font-medium"
                >
                  Contract Details
                </Label>
                <Input
                  id="newEmployeeContract"
                  type="text"
                  value={newEmployee.contractDetails}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      contractDetails: e.target.value,
                    })
                  }
                  className="mt-1 block w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
