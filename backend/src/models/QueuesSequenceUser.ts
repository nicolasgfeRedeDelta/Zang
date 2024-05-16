import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  HasMany,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Queue from "./Queue";
import User from "./User";
import { Bool } from "aws-sdk/clients/clouddirectory";

@Table
@Table({ tableName: 'QueuesSequenceUser' })
class QueuesSequenceUser extends Model<QueuesSequenceUser> {
  
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
 
  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @ForeignKey(() => User)
  @Column
  userId: string;
  
  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  currentUser: Boolean;

  @BelongsTo(() => Queue)
  queue: Queue;

  @BelongsTo(() => User)
  user: User;
}

export default QueuesSequenceUser;
