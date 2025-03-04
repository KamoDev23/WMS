"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Project {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  typeOfWork: string;
  location: string;
  date: string;
}

export interface ProjectsListProps {
  projects: Project[];
}

type SortOrder = "asc" | "desc";

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  const router = useRouter();
  // Use passed-in projects; default to empty array if none provided.
  const data = projects ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Project | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const handleSort = (column: keyof Project) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const filteredProjects = useMemo(() => {
    return data.filter((project) =>
      Object.values(project).some((value) =>
        value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, data]);

  const sortedProjects = useMemo(() => {
    if (!sortColumn) return filteredProjects;
    return [...filteredProjects].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProjects, sortColumn, sortOrder]);

  const totalPages = Math.ceil(sortedProjects.length / rowsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedProjects.slice(start, start + rowsPerPage);
  }, [sortedProjects, currentPage]);

  const handleRowClick = (id: string) => {
    router.push(`/projects/${id}`);
  };

  return (
    <section className="p-4 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Projects</h2>
      <div className="mb-4">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("id")}>
              Project ID{" "}
              {sortColumn === "id" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </TableHead>
            <TableHead onClick={() => handleSort("registrationNumber")}>
              Registration Number{" "}
              {sortColumn === "registrationNumber"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </TableHead>
            <TableHead onClick={() => handleSort("typeOfWork")}>
              Type of Work{" "}
              {sortColumn === "typeOfWork"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </TableHead>
            <TableHead onClick={() => handleSort("location")}>
              Location{" "}
              {sortColumn === "location"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </TableHead>
            <TableHead onClick={() => handleSort("date")}>
              Date{" "}
              {sortColumn === "date" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProjects.length ? (
            paginatedProjects.map((project) => (
              <TableRow
                key={project.id}
                onClick={() => handleRowClick(project.id)}
              >
                <TableCell>{project.id}</TableCell>
                <TableCell>{project.registrationNumber}</TableCell>
                <TableCell>{project.typeOfWork}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell>{project.date}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                No results.
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
};

export default ProjectsList;
