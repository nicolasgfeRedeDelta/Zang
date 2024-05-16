import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  HasMany
} from "sequelize-typescript";
import Queue from "./Queue";
import User from "./User";
import QueueOptionMessageResponses from "./QueueOptionMessageReponse";
import UserQueue from "./UserQueue";

@Table
class QueueOption extends Model<QueueOption> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  title: string;

  @AllowNull
  @Column
  option: string;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @ForeignKey(() => QueueOption)
  @Column
  chatbotId: number;

  @ForeignKey(() => User)
  @Column
  agentId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Queue)
  queue: Queue;

  // @BelongsTo(() => QueueOption, { foreignKey: 'parentId' })
  // parent: QueueOption;

  @Column
  isAgent: boolean;

  @HasMany(() => QueueOption)
  mainChatbot: QueueOption[];

  @HasMany(() => QueueOption)
  options: QueueOption[];

  @HasMany(() => QueueOptionMessageResponses, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  messages: QueueOptionMessageResponses[];
}

export default QueueOption;
