import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  AllowNull,
  Unique,
  HasMany
} from "sequelize-typescript";

import Company from "./Company";
import QuickMessageResponse from "./QuickMessageResponse";
import User from "./User";
import QuickMessageModules from "./QuickMessageModules";

@Table
class QuickMessage extends Model<QuickMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  color: string;

  @Column
  shortcode: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => QuickMessageResponse, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  messages: QuickMessageResponse[];

  @HasMany(() => QuickMessageModules, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  modules: QuickMessageModules[];
}

export default QuickMessage;
