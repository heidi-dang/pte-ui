import { Router } from 'express';
import { authRouter } from '../auth';
import { studentRouter } from '../student';
import { teacherRouter } from '../teacher';
import { adminRouter } from '../admin';
import { testRouter } from '../testSeeder';

export function mountRoutes(): Router {
  const router = Router();

  router.use('/auth', authRouter);
  router.use('/student', studentRouter);
  router.use('/teacher', teacherRouter);
  router.use('/admin', adminRouter);
  router.use('/test', testRouter);

  return router;
}
