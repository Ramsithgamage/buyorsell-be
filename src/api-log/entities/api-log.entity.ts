import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('api_logs')
export class ApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_API_LOGS_METHOD')
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 255 })
  path: string;

  @Index('IDX_API_LOGS_STATUS_CODE')
  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  durationMs: number;

  @Index('IDX_API_LOGS_USER_ID')
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'json' })
  metadata: {
    query: Record<string, any>;
    body: Record<string, any>;
    errorMessage: string | null;
  };

  @Index('IDX_API_LOGS_CREATED_AT')
  @CreateDateColumn()
  createdAt: Date;
}
