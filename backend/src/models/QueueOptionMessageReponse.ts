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
  BelongsTo
} from "sequelize-typescript";
import QueueOption from "./QueueOption";

@Table
class QueueOptionMessageResponses extends Model<QueueOptionMessageResponses> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  message: string;

  @ForeignKey(() => QueueOption)
  @Column
  queueOptionId: number;

  @CreatedAt
  createdAt: Date;
 
  @UpdatedAt
  updatedAt: Date;
    
  @Column
  mediaUrl: string;

  @BelongsTo(() => QueueOption)
  queueOption: QueueOption;

  @Column
  timeSendMessage: number;

  @Column
  mimetype: string;
}

export default QueueOptionMessageResponses;
