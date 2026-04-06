import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Settings } from '@/lib/server/models/Settings';

interface SettingsDoc {
  _id: { toString(): string };
  groupName?: string;
  logo?: string;
  description?: string;
  foundedDate?: Date;
  location?: { street?: string; city?: string; county?: string; country?: string };
  contactPhone?: string;
  contactEmail?: string;
  registrationNumber?: string;
  mission?: string;
  vision?: string;
  leadershipStructure?: any;
  defaultInterestRate?: number;
  shareValue?: number;
  monthlyContribution?: number;
  weeklyContribution?: number;
  smsNotifications?: boolean;
  emailNotifications?: boolean;
}

export async function GET() {
  const defaultSettings = {
    _id: 'default',
    groupName: 'Githirioni Self Help Group',
    mission: 'To mobilize savings and provide credit facilities to members.',
    vision: 'To be a leading self-help group in financial empowerment.',
    defaultInterestRate: 10,
    shareValue: 1000,
    monthlyContribution: 1000,
    weeklyContribution: 250,
    smsNotifications: true,
    emailNotifications: true,
  };

  try {
    await dbConnect();
    
    let settings = await Settings.findOne().sort({ createdAt: -1 }).lean() as SettingsDoc | null;
    
    if (!settings) {
      try {
        settings = await Settings.create({}) as SettingsDoc;
      } catch {
        settings = defaultSettings as unknown as SettingsDoc;
      }
    }
    
    return NextResponse.json({ 
      settings: {
        _id: settings._id?.toString() || 'default',
        groupName: settings.groupName || defaultSettings.groupName,
        logo: settings.logo,
        description: settings.description,
        foundedDate: settings.foundedDate?.toISOString(),
        location: settings.location,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        registrationNumber: settings.registrationNumber,
        mission: settings.mission || defaultSettings.mission,
        vision: settings.vision || defaultSettings.vision,
        leadershipStructure: settings.leadershipStructure,
        defaultInterestRate: settings.defaultInterestRate ?? defaultSettings.defaultInterestRate,
        shareValue: settings.shareValue ?? defaultSettings.shareValue,
        monthlyContribution: settings.monthlyContribution ?? defaultSettings.monthlyContribution,
        weeklyContribution: settings.weeklyContribution ?? defaultSettings.weeklyContribution,
        smsNotifications: settings.smsNotifications ?? defaultSettings.smsNotifications,
        emailNotifications: settings.emailNotifications ?? defaultSettings.emailNotifications,
      }
    });
  } catch (error) {
    console.error('Error fetching settings, returning defaults:', error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    const existingSettings = await Settings.findOne().sort({ createdAt: -1 });
    
    const updateData: any = {};
    const allowedFields = [
      'groupName', 'logo', 'description', 'foundedDate', 'location',
      'contactPhone', 'contactEmail', 'registrationNumber', 'mission', 'vision',
      'leadershipStructure', 'defaultInterestRate', 'shareValue',
      'monthlyContribution', 'weeklyContribution', 'smsNotifications', 'emailNotifications'
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    let settings;
    if (existingSettings) {
      settings = await Settings.findByIdAndUpdate(
        existingSettings._id,
        updateData,
        { new: true }
      );
    } else {
      settings = await Settings.create(updateData);
    }
    
    return NextResponse.json({ 
      settings: {
        _id: (settings as any)._id.toString(),
        groupName: settings.groupName,
        logo: settings.logo,
        description: settings.description,
        foundedDate: settings.foundedDate?.toISOString(),
        location: settings.location,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        registrationNumber: settings.registrationNumber,
        mission: settings.mission,
        vision: settings.vision,
        leadershipStructure: settings.leadershipStructure,
        defaultInterestRate: settings.defaultInterestRate,
        shareValue: settings.shareValue,
        monthlyContribution: settings.monthlyContribution,
        weeklyContribution: settings.weeklyContribution,
        smsNotifications: settings.smsNotifications,
        emailNotifications: settings.emailNotifications,
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}