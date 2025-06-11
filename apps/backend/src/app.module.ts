import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FilesystemModule } from './filesystem/filesystem.module';
import { PrismaModule } from './prisma/prisma.module';
import { WeightModule } from './weight/weight.module';

@Module({
  imports: [UsersModule, FilesystemModule, PrismaModule, WeightModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
