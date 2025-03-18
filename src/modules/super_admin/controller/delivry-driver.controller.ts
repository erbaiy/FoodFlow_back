
    import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { DeliveryDriverService } from "../services/delivy-driver.service";
import { User } from "src/modules/auth/schema/user.schema";
import { AuthService } from "src/modules/auth/services/auth.service";

@Controller('super-admin/delivery-driver')
export class DeliveryDriverController {
  constructor(
    private readonly deliveryDriverService: DeliveryDriverService,
  ) {}
  // create new driver  Controller Method
@Post()
async createDriver(@Body(  )
  dto: any) {
  console.log('dto', dto);
  return await this.deliveryDriverService.createDriver(dto);
}

  // get all delivery drivers
  @Get()
  async getAllDeliveryDriver() {
    return await this.deliveryDriverService.getAllDeliveryDriver();

  }

  // get delivery driver by id
  @Get(':id')
  async getDeliveryDriverById() {
    return await this.deliveryDriverService.getAllDeliveryDriver();
  }

    // update delivery driver
    @Put(':id')
    async updateDeliveryDriver(
        @Param('id') id: string,
        @Body() updateData: Partial<User>,
      ) {
      return await this.deliveryDriverService.updateDeliveryDriver(id, updateData);
    }

    
   // delete delivery driver
    @Delete(':id')
    async deleteDeliveryDriver(
        @Param('id') id: string,
      ) {
      return await this.deliveryDriverService.deleteDeliveryDriver(id);
    }

    




}
