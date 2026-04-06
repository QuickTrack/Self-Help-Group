import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Savings } from '@/lib/server/models';

export async function GET() {
  try {
    await dbConnect();
    
    const allSavings = await Savings.find().lean();
    
    return NextResponse.json({
      totalRecords: allSavings.length,
      records: allSavings.map(s => ({
        _id: s._id?.toString(),
        member: s.member?.toString(),
        savingsBalance: s.savingsBalance,
        totalShares: s.totalShares,
        isGroup: s.isGroup,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}