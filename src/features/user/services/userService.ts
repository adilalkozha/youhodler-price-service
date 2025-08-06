import { User } from '../models/User';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { logger } from '../../../config/logger';

export class UserService {
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const user = await User.create(userData);
      logger.info(`User created with ID: ${user.id}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      return await User.findByPk(id);
    } catch (error) {
      logger.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      logger.error(`Error fetching user with email ${email}:`, error);
      throw error;
    }
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<User | null> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return null;
      }

      await user.update(userData);
      logger.info(`User updated with ID: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return false;
      }

      await user.destroy();
      logger.info(`User deleted with ID: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await User.findAll({
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw error;
    }
  }
}

export default new UserService();