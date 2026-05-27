import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyFeedbackDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}
