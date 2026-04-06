import { NextResponse } from 'next/server';
import { WelfareFund, WelfarePayout, Member } from '@/lib/server/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateFilter.$gte = startDate ? new Date(startDate) : new Date(`${year || new Date().getFullYear()}-01-01`);
      dateFilter.$lte = endDate ? new Date(endDate) : new Date(`${year || new Date().getFullYear()}-12-31`);
    } else if (year) {
      dateFilter.$gte = new Date(`${year}-01-01`);
      dateFilter.$lte = new Date(`${year}-12-31`);
    }
    
    if (type === 'summary') {
      const [contributions, payouts, members] = await Promise.all([
        WelfareFund.aggregate([
          ...(Object.keys(dateFilter).length ? [{ $match: { date: dateFilter } }] : []),
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        WelfarePayout.aggregate([
          { $match: { status: { $in: ['Approved', 'Paid'] } } },
          ...(Object.keys(dateFilter).length ? [{ $match: { createdAt: dateFilter } }] : []),
          { $group: { _id: null, total: { $sum: '$approvedAmount' }, count: { $sum: 1 } } }
        ]),
        Member.countDocuments({ status: 'active' })
      ]);
      
      return NextResponse.json({
        fundBalance: (contributions[0]?.total || 0) - (payouts[0]?.total || 0),
        totalContributions: contributions[0]?.total || 0,
        contributionCount: contributions[0]?.count || 0,
        totalPayouts: payouts[0]?.total || 0,
        payoutCount: payouts[0]?.count || 0,
        activeMembers: members,
        period: { year, startDate, endDate },
      });
    }
    
    if (type === 'contributions') {
      const contributions = await WelfareFund.find(
        Object.keys(dateFilter).length ? { date: dateFilter } : {}
      )
        .populate('member', 'memberId fullName')
        .sort({ date: -1 });
      
      return NextResponse.json({
        report: 'Contributions Report',
        generatedAt: new Date(),
        period: { year, startDate, endDate },
        data: contributions.map(c => ({
          date: c.date,
          memberId: (c.member as unknown as { memberId: string })?.memberId,
          memberName: (c.member as unknown as { fullName: string })?.fullName,
          amount: c.amount,
          paymentMethod: c.paymentMethod,
          notes: c.notes,
        })),
      });
    }
    
    if (type === 'payouts') {
      const payouts = await WelfarePayout.find()
        .populate('member', 'memberId fullName')
        .sort({ createdAt: -1 });
      
      return NextResponse.json({
        report: 'Payouts Report',
        generatedAt: new Date(),
        period: { year, startDate, endDate },
        data: payouts.map(p => ({
          requestDate: p.createdAt,
          memberId: (p.member as unknown as { memberId: string })?.memberId,
          memberName: (p.member as unknown as { fullName: string })?.fullName,
          eventType: p.eventType,
          description: p.eventDescription,
          requestedAmount: p.requestedAmount,
          approvedAmount: p.approvedAmount,
          status: p.status,
          approvedAt: p.approvedAt,
          paidAt: p.paidAt,
          eligibilityCheck: p.eligibilityCheck,
        })),
      });
    }
    
    if (type === 'audit') {
      const [contributions, payouts] = await Promise.all([
        WelfareFund.find(Object.keys(dateFilter).length ? { date: dateFilter } : {})
          .populate('member', 'memberId fullName')
          .populate('recordedBy', 'email')
          .sort({ date: -1 }),
        WelfarePayout.find()
          .populate('member', 'memberId fullName')
          .populate('approvedBy', 'email')
          .populate('rejectedBy', 'email')
          .populate('paidBy', 'email')
          .populate('requestBy', 'email')
          .sort({ createdAt: -1 }),
      ]);
      
      return NextResponse.json({
        report: 'Audit Trail Report',
        generatedAt: new Date(),
        period: { year, startDate, endDate },
        summary: {
          totalContributions: contributions.reduce((s, c) => s + c.amount, 0),
          totalPayouts: payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.approvedAmount || 0), 0),
          netFundBalance: contributions.reduce((s, c) => s + c.amount, 0) - payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.approvedAmount || 0), 0),
        },
        contributions: contributions.map(c => ({
          date: c.date,
          type: 'CONTRIBUTION',
          memberId: (c.member as unknown as { memberId: string })?.memberId,
          memberName: (c.member as unknown as { fullName: string })?.fullName,
          amount: c.amount,
          paymentMethod: c.paymentMethod,
          recordedBy: (c.recordedBy as unknown as { email: string })?.email,
          createdAt: c.createdAt,
        })),
        payouts: payouts.map(p => ({
          date: p.createdAt,
          type: 'PAYOUT',
          memberId: (p.member as unknown as { memberId: string })?.memberId,
          memberName: (p.member as unknown as { fullName: string })?.fullName,
          eventType: p.eventType,
          amount: p.approvedAmount || p.requestedAmount,
          status: p.status,
          requestBy: (p.requestBy as unknown as { email: string })?.email,
          approvedBy: (p.approvedBy as unknown as { email: string })?.email,
          rejectedBy: (p.rejectedBy as unknown as { email: string })?.email,
          paidBy: (p.paidBy as unknown as { email: string })?.email,
          createdAt: p.createdAt,
          approvedAt: p.approvedAt,
          paidAt: p.paidAt,
        })),
      });
    }
    
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}