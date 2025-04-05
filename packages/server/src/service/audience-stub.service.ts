/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common'

@Injectable()
export class ContactService {
  async count(
    teamId?: string,
    keyword?: string,
    groupIds?: string[]
  ): Promise<number> {
    return 0
  }

  async findAll(
    teamId?: string,
    groupIds?: string[],
    keyword?: string,
    page?: number,
    limit?: number
  ): Promise<any[]> {
    return []
  }

  async create(data: any): Promise<string> {
    return ''
  }

  async update(
    teamId: string,
    contactId: string,
    updates: any
  ): Promise<boolean> {
    return true
  }

  async updateMany(
    teamId: string,
    contactIds: string[],
    updates: any
  ): Promise<boolean> {
    return true
  }

  async delete(): Promise<boolean> {
    return true
  }

  async deleteByIds(teamId: string, contactIds: string[]): Promise<boolean> {
    return true
  }

  async importContacts(): Promise<number> {
    return 0
  }

  async deleteMany(): Promise<boolean> {
    return true
  }

  async findByTeamAndEmail(teamId: string, email: string): Promise<any> {
    return null
  }

  async countInGroups(teamId: string): Promise<any[]> {
    return []
  }

  async insertMany(contacts: any[]): Promise<boolean> {
    return true
  }
}

@Injectable()
export class GroupService {
  async count(teamId?: string, keyword?: string): Promise<number> {
    return 0
  }

  async findAll(
    teamId?: string,
    keyword?: string,
    page?: number,
    limit?: number
  ): Promise<any[]> {
    return []
  }

  async create(data: any): Promise<string> {
    return ''
  }

  async update(
    teamId: string,
    groupId: string,
    name: string
  ): Promise<boolean> {
    return true
  }

  async delete(teamId: string, groupId: string): Promise<boolean> {
    return true
  }

  async addContacts(
    teamId: string,
    groupId: string,
    contactIds: string[]
  ): Promise<boolean> {
    return true
  }
}
