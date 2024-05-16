import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  HasMany
} from "sequelize-typescript";
import QuickMessage from "./QuickMessage";

@Table
class QuickMessageResponse extends Model<QuickMessageResponse> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  message: string;

  @ForeignKey(() => QuickMessage)
  @Column
  quickMessageId: number;

  @CreatedAt
  createdAt: Date;
 
  @UpdatedAt
  updatedAt: Date;
    
  @Column
  mediaUrl: string;

  @Column
  timeSendMessage: number;

  @Column
  mimetype : string;
}

export default QuickMessageResponse;
