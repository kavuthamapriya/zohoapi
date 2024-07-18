import { DataSource } from "typeorm";
import path from "path";


export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "Test",
  synchronize: true,
  logging: false,
  entities: [path.join(process.cwd(), "src/entites/*.ts")],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: []
});

export const checkConnection = async () => {
  try {
    await AppDataSource.initialize();
    console.log("db connected successfully");
  } catch (error) {
    
    console.log("cannot connect to db",error);
  }
};
