import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { CustomerRepository } from './customer.repository';
import { CustomerAdminService } from './services/customer.admin.service';
import { CustomerAdminController } from './controllers/customer.admin.controller';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    CustomFieldsModule,
  ],
  controllers: [CustomerAdminController],
  providers: [CustomerRepository, CustomerAdminService],
})
export class CustomerModule {}
