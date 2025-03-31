import { Request } from 'express';
import mongoose from 'mongoose';

export interface RequestWithUser extends Request {
  user: {
    id: mongoose.Types.ObjectId;
  };
}


