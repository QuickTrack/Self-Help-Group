import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { FinancialSettings } from '@/lib/server/models/FinancialSettings';

interface FinancialSettingsDoc {
  _id?: { toString(): string };
  bonusPerAttendance?: number;
  shareValue?: number;
  interestRate?: number;
  monthlyContribution?: number;
  welfareContribution?: number;
  meetingBudget?: number;
  loanProcessingFee?: number;
  latePaymentPenalty?: number;
}

export async function GET() {
  const defaults = {
    bonusPerAttendance: 1000,
    shareValue: 5000,
    interestRate: 10,
    monthlyContribution: 1000,
    welfareContribution: 100,
    meetingBudget: 200,
    loanProcessingFee: 500,
    latePaymentPenalty: 100,
  };

  try {
    await dbConnect();
    
    const settings = await FinancialSettings.findOne().sort({ createdAt: -1 }).lean() as FinancialSettingsDoc | null;
    
    if (!settings) {
      const created = await FinancialSettings.create({});
    return NextResponse.json({ 
      settings: {
        _id: (created as any)._id?.toString() || 'default',
        bonusPerAttendance: defaults.bonusPerAttendance,
        shareValue: defaults.shareValue,
        interestRate: defaults.interestRate,
        monthlyContribution: defaults.monthlyContribution,
        welfareContribution: defaults.welfareContribution,
        meetingBudget: defaults.meetingBudget,
        loanProcessingFee: defaults.loanProcessingFee,
        latePaymentPenalty: defaults.latePaymentPenalty,
      }
    });
    }
    
    return NextResponse.json({ 
      settings: {
        _id: settings._id?.toString() || 'default',
        bonusPerAttendance: settings.bonusPerAttendance ?? defaults.bonusPerAttendance,
        shareValue: settings.shareValue ?? defaults.shareValue,
        interestRate: settings.interestRate ?? defaults.interestRate,
        monthlyContribution: settings.monthlyContribution ?? defaults.monthlyContribution,
        welfareContribution: settings.welfareContribution ?? defaults.welfareContribution,
        meetingBudget: settings.meetingBudget ?? defaults.meetingBudget,
        loanProcessingFee: settings.loanProcessingFee ?? defaults.loanProcessingFee,
        latePaymentPenalty: settings.latePaymentPenalty ?? defaults.latePaymentPenalty,
      }
    });
  } catch (error) {
    console.error('Error fetching financial settings:', error);
    return NextResponse.json({ settings: defaults });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    const existingSettings = await FinancialSettings.findOne().sort({ createdAt: -1 });
    
    const updateData: any = {};
    const allowedFields = [
      'bonusPerAttendance', 'shareValue', 'interestRate', 
      'monthlyContribution', 'welfareContribution', 'meetingBudget', 'loanProcessingFee', 'latePaymentPenalty'
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    let settings;
    if (existingSettings) {
      settings = await FinancialSettings.findByIdAndUpdate(
        existingSettings._id,
        updateData,
        { new: true }
      );
    } else {
      settings = await FinancialSettings.create(updateData);
    }
    
    return NextResponse.json({ 
      settings: {
        _id: (settings as any)._id.toString(),
        bonusPerAttendance: settings.bonusPerAttendance,
        shareValue: settings.shareValue,
        interestRate: settings.interestRate,
        monthlyContribution: settings.monthlyContribution,
        welfareContribution: settings.welfareContribution,
        meetingBudget: settings.meetingBudget,
        loanProcessingFee: settings.loanProcessingFee,
        latePaymentPenalty: settings.latePaymentPenalty,
      }
    });
  } catch (error) {
    console.error('Error updating financial settings:', error);
    return NextResponse.json({ error: 'Failed to update financial settings' }, { status: 500 });
  }
}