import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Savings } from '@/lib/server/models';

interface SavingsDoc {
  _id?: { toString(): string };
  savingsBalance?: number;
  totalShares?: number;
  isGroup?: boolean;
}

export async function GET() {
  try {
    await dbConnect();
    
    const groupSavings = await Savings.findOne({ isGroup: true }).lean() as SavingsDoc | null;
    
    if (!groupSavings) {
      return NextResponse.json({ 
        savingsBalance: 0,
        totalShares: 0,
      });
    }
    
    return NextResponse.json({
      _id: groupSavings._id?.toString(),
      savingsBalance: groupSavings.savingsBalance,
      totalShares: groupSavings.totalShares,
      isGroup: true,
    });
  } catch (error) {
    console.error('Error fetching group savings:', error);
    return NextResponse.json({ 
      savingsBalance: 0,
      totalShares: 0,
    });
  }
}