import type { Task } from "@/types";

export const DEMO_TASKS: Task[] = [
  // Riverside Remodel
  { id: "task_1", jobId: "job_riverside", title: "Demo existing kitchen", done: true, assigneeId: "emp_marcus", dueDate: "2026-05-10" },
  { id: "task_2", jobId: "job_riverside", title: "Rough-in electrical for community kitchen", done: true, assigneeId: "emp_marcus", dueDate: "2026-06-01" },
  { id: "task_3", jobId: "job_riverside", title: "Install new flooring — clubhouse main hall", done: true, assigneeId: "emp_diego", dueDate: "2026-06-20" },
  { id: "task_4", jobId: "job_riverside", title: "Final electrical inspection", done: false, assigneeId: "emp_marcus", dueDate: "2026-07-25" },
  { id: "task_5", jobId: "job_riverside", title: "Submit final inspection request", done: false, assigneeId: "emp_marcus", dueDate: "2026-07-20" },

  // Smith Co. Renovation (overdue)
  { id: "task_6", jobId: "job_smith", title: "Install new storefront signage", done: true, assigneeId: "emp_taylor", dueDate: "2026-05-15" },
  { id: "task_7", jobId: "job_smith", title: "ADA-compliant entrance ramp", done: false, assigneeId: "emp_taylor", dueDate: "2026-06-15" },
  { id: "task_8", jobId: "job_smith", title: "Final walkthrough with Smith Co.", done: false, assigneeId: "emp_jane", dueDate: "2026-06-25" },

  // Downtown Lofts (overdue)
  { id: "task_9", jobId: "job_downtown", title: "Lobby demo and framing", done: true, assigneeId: "emp_diego", dueDate: "2026-04-01" },
  { id: "task_10", jobId: "job_downtown", title: "Elevator interior refresh", done: true, assigneeId: "emp_casey", dueDate: "2026-05-20" },
  { id: "task_11", jobId: "job_downtown", title: "Rooftop deck framing", done: false, assigneeId: "emp_casey", dueDate: "2026-06-20" },
  { id: "task_12", jobId: "job_downtown", title: "Final punch list walkthrough", done: false, assigneeId: "emp_jane", dueDate: "2026-06-27" },

  // Harbor View
  { id: "task_13", jobId: "job_harbor", title: "Permit submission", done: true, assigneeId: "emp_priya", dueDate: "2026-07-10" },
  { id: "task_14", jobId: "job_harbor", title: "Order structural steel", done: false, assigneeId: "emp_priya", dueDate: "2026-07-28" },

  // Sunridge
  { id: "task_15", jobId: "job_sunridge", title: "Finalize exam room layout with client", done: true, assigneeId: "emp_jane", dueDate: "2026-07-05" },
  { id: "task_16", jobId: "job_sunridge", title: "Order medical-grade flooring", done: false, assigneeId: "emp_jane", dueDate: "2026-08-01" },

  // Fifth Ave
  { id: "task_17", jobId: "job_fifth", title: "Install fitting room partitions", done: true, assigneeId: "emp_diego", dueDate: "2026-06-15" },
  { id: "task_18", jobId: "job_fifth", title: "POS counter build", done: false, assigneeId: "emp_diego", dueDate: "2026-07-15" },

  // Done jobs
  { id: "task_19", jobId: "job_lincoln", title: "Pergola frame assembly", done: true, assigneeId: "emp_casey", dueDate: "2026-05-10" },
  { id: "task_20", jobId: "job_lincoln", title: "Seating install and sign-off", done: true, assigneeId: "emp_casey", dueDate: "2026-05-30" },
  { id: "task_21", jobId: "job_oakwood", title: "Tear off old roofing", done: true, assigneeId: "emp_taylor", dueDate: "2026-03-20" },
  { id: "task_22", jobId: "job_oakwood", title: "Install new membrane roofing", done: true, assigneeId: "emp_taylor", dueDate: "2026-05-01" },
];

export function getTasksForJob(jobId: string) {
  return DEMO_TASKS.filter((t) => t.jobId === jobId);
}
