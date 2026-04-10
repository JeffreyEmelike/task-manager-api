//1. Basic Types
const port: number = 3000;
const appName: string = "TaskManager";
const isReady: boolean = false;

//2. interface - describes the shape of an object
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member" | "guest"; // union type
  createdAt: Date;
}

//3. Optional and readOnly fields
interface Task {
  readonly _id: string; // cannot be reassigned
  title: string;
  description?: string; // ? means optional
  dueDate?: Date;
}

//4. generics - reusable typed containers
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Usage - Typescript infers what T is
const response: ApiResponse<User[]> = {
  success: true,
  data: [],
  message: "Users fetched",
};

//5. Async functions always return Promise<T>
async function fetchUser(id: string): Promise<User | null> {
  //Typescript enforces you return User | null, nothing else.
  return null;
}
