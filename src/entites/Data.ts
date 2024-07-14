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
  id: number=0;

  @Column('bigint')
  componentId: number=0;

  @Column()
  leaveLinkName: string='';

  @Column()
  PermissionDetails: string='';

  @Column({
    type:'enum',
    enum:LeaveStatus,
    default: LeaveStatus.ADDED,
  })
  status: LeaveStatus = LeaveStatus.ADDED;

  @Column({default: 0})
  retryCount: number=0;
  
  @CreateDateColumn()
  createdAt: Date= new Date();
}
