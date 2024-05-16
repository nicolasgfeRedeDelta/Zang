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
class QuickMessageModules extends Model<QuickMessageModules> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
 
  @ForeignKey(() => QuickMessage)
  @Column
  quickMessageId: number;

  @Column
  modules: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default QuickMessageModules;
