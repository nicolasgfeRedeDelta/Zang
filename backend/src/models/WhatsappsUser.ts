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
import Whatsapp from "./Whatsapp";

@Table
@Table({ tableName: 'WhatsappsUser' })
class WhatsappsUser extends Model<WhatsappsUser> {
  
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;
  
  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}

export default WhatsappsUser;
