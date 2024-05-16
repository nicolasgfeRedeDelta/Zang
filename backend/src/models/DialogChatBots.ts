import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Contact from "./Contact";
import Queue from "./Queue";
import QueueOption from "./QueueOption";

@Table
class DialogChatBots extends Model<DialogChatBots> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  awaiting: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @ForeignKey(() => QueueOption)
  @Column
  chatbotId: number;

  @BelongsTo(() => QueueOption)
  chatbots: QueueOption;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default DialogChatBots;
