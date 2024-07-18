import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum LeaveStatus{
  ADDED = 'Added',
  IN_PROGRESS = 'In_progress',
  FAILED = 'Failed',
  RETRY = 'Retry',
  COMPLETED = 'Completed',
 }

@Entity()
export class LeaveData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint')
  locationId: number;

  @Column()
  Remarks: string;

  @Column()
  Name: string;

  @Column({
    type:'enum',
    enum:LeaveStatus,
    default: LeaveStatus.ADDED,
  })
  status: LeaveStatus = LeaveStatus.ADDED;

  @Column({default: 0})
  retryCount: number;
  
  @CreateDateColumn()
  createdAt: Date;
}
