import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { WelfarePayout, Member, WelfareFund, Savings, EligibilitySettings, initializeEligibilitySettings, LifeEventType } from '@/lib/server/models';
import mongoose from 'mongoose';

const EVENT_LIMITS: Record<string, number> = {
  Bereavement: 20000,
  Wedding: 15000,
  Celebration: 10000,
  Medical: 25000,
  Disaster: 30000,
};

async function getEligibilitySettings() {
  await initializeEligibilitySettings();
  const settings = await EligibilitySettings.find({ category: { $in: ['eligibility', 'limits'] } });
  const settingsMap: Record<string, any> = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  
  const lifeEventTypes = await LifeEventType.find({}).lean();
  lifeEventTypes.forEach(e => {
    settingsMap[`limit${e.name}`] = e.maxCompensation;
  });
  
  return settingsMap;
}

async function getEventLimit(eventType: string) {
  const settings = await getEligibilitySettings();
  return settings[`limit${eventType}`] || EVENT_LIMITS[eventType] || 10000;
}

async function verifyMemberEligibility(memberId: string) {
  let member;
  
  if (mongoose.Types.ObjectId.isValid(memberId) && memberId.length === 24) {
    member = await Member.findById(memberId);
  } else {
    member = await Member.findOne({ memberId: memberId });
  }
  
  if (!member) {
    return { isEligible: false, reasons: ['Member not found'] };
  }

  const settings = await getEligibilitySettings();
  const reasons: string[] = [];
  const warnings: string[] = [];

  // Check active status requirement
  if (settings.requireActiveStatus && member.status !== 'active') {
    reasons.push('Member is not active');
  }

  // Check membership period
  const joinDate = new Date(member.joinDate);
  const monthsActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const minMembershipMonths = settings.minimumMembershipMonths || 3;
  if (monthsActive < minMembershipMonths) {
    reasons.push(`Membership period (${monthsActive} months) below minimum (${minMembershipMonths} months)`);
  }

  // Check total contributions
  const welfareContributions = await WelfareFund.find({ member: memberId });
  const totalContributed = welfareContributions.reduce((sum, c) => sum + c.amount, 0);
  const minContributionAmount = settings.minimumContributionsAmount || 750;
  if (totalContributed < minContributionAmount) {
    reasons.push(`Total welfare contributions (KES ${totalContributed}) below minimum (KES ${minContributionAmount})`);
  }

  // Check recent contributions
  const monthlyContributions = await WelfareFund.countDocuments({
    member: memberId,
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  });
  const minContributionMonths = settings.minimumContributionMonths || 3;
  if (monthlyContributions < minContributionMonths) {
    reasons.push(`Contributions in last 3 months (${monthlyContributions}) below minimum (${minContributionMonths})`);
  }

  // Check for pending disputes/holds (check for rejected payouts in last 30 days)
  const recentRejections = await WelfarePayout.countDocuments({
    member: memberId,
    status: 'Rejected',
    updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  if (recentRejections > 0) {
    warnings.push(`Member has ${recentRejections} rejected payout request(s) in the last 30 days`);
  }

  // Check for pending payout requests
  const pendingPayouts = await WelfarePayout.countDocuments({
    member: memberId,
    status: { $in: ['Pending', 'Approved'] }
  });
  if (pendingPayouts > 0) {
    warnings.push(`Member has ${pendingPayouts} pending payout request(s)`);
  }

  const isEligible = reasons.length === 0;

  return {
    isEligible,
    reasons,
    warnings,
    accountStanding: isEligible ? 'Good' : 'Not Eligible',
    checks: {
      activeStatus: member.status === 'active',
      membershipPeriod: monthsActive >= minMembershipMonths,
      totalContributions: totalContributed >= minContributionAmount,
      recentContributions: monthlyContributions >= minContributionMonths,
      noDisputes: recentRejections === 0,
      noPendingPayouts: pendingPayouts === 0,
    },
    details: {
      monthsActive,
      totalContributed,
      monthlyContributions,
      recentRejections,
      pendingPayouts,
    }
  };
}

async function checkEligibility(memberId: string, eventType: string, requestedAmount: number) {
  const settings = await getEligibilitySettings();
  let member;
  
  if (mongoose.Types.ObjectId.isValid(memberId) && memberId.length === 24) {
    member = await Member.findById(memberId);
  } else {
    member = await Member.findOne({ memberId: memberId });
  }
  
  if (!member) {
    return { isEligible: false, reasons: ['Member not found'] };
  }
  
  const reasons: string[] = [];
  const minContributionAmount = settings.minimumContributionsAmount || 750;
  const minContributionMonths = settings.minimumContributionMonths || 3;
  const minMembershipMonths = settings.minimumMembershipMonths || 3;
  
  if (member.status !== 'active') {
    reasons.push('Member is not active');
  }
  
  const joinDate = new Date(member.joinDate);
  const monthsActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const welfareContributions = await WelfareFund.find({ member: memberId });
  const totalContributed = welfareContributions.reduce((sum, c) => sum + c.amount, 0);
  
  const monthlyContributions = await WelfareFund.countDocuments({
    member: memberId,
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  });
  
  if (totalContributed < minContributionAmount) {
    reasons.push(`Total welfare contributions (KES ${totalContributed}) below minimum (KES ${minContributionAmount})`);
  }
  
  if (monthlyContributions < minContributionMonths) {
    reasons.push(`Contributions in last 3 months (${monthlyContributions}) below minimum (${minContributionMonths})`);
  }
  
  if (monthsActive < minMembershipMonths) {
    reasons.push(`Membership period (${monthsActive} months) below minimum (${minMembershipMonths} months)`);
  }
  
  const maxLimit = await getEventLimit(eventType);
  if (requestedAmount > maxLimit) {
    reasons.push(`Requested amount (KES ${requestedAmount}) exceeds ${eventType} limit (KES ${maxLimit})`);
  }
  
  const isEligible = reasons.length === 0;
  
  return {
    isEligible,
    minimumContributions: minContributionMonths,
    minimumMonths: minMembershipMonths,
    contributionMade: totalContributed,
    monthsActive,
    reasons,
    checkedAt: new Date(),
  };
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const query: Record<string, unknown> = {};
    
    if (memberId) query.member = memberId;
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    
    const skip = (page - 1) * limit;
    
    const [payouts, total] = await Promise.all([
      WelfarePayout.find(query)
        .populate('member', 'memberId fullName phoneNumber')
        .populate('approvedBy', 'email')
        .populate('rejectedBy', 'email')
        .populate('paidBy', 'email')
        .populate('requestBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WelfarePayout.countDocuments(query)
    ]);
    
    const stats = await WelfarePayout.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$approvedAmount' }
      }}
    ]);
    
    return NextResponse.json({
      payouts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    console.error('Error fetching welfare payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { member: memberInput, eventType, eventDescription, requestedAmount, eventDate, notes, requestBy } = body;
    
    let memberId = memberInput;
    if (!mongoose.Types.ObjectId.isValid(memberInput) || memberInput.length !== 24) {
      const foundMember = await Member.findOne({ memberId: memberInput });
      if (!foundMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 400 });
      }
      memberId = foundMember._id.toString();
    }
    
    const eligibilityCheck = await checkEligibility(memberId, eventType, requestedAmount);
    
    const payout = new WelfarePayout({
      member: memberId,
      eventType,
      eventDescription,
      requestedAmount,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      notes,
      requestBy,
      eligibilityCheck,
      status: eligibilityCheck.isEligible ? 'Pending' : 'Pending',
    });
    
    await payout.save();
    
    const populated = await WelfarePayout.findById(payout._id)
      .populate('member', 'memberId fullName phoneNumber');
    
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Error creating welfare payout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('validation') || errorMessage.includes('Cast to ObjectId')) {
      return NextResponse.json({ 
        error: "We're sorry, but we couldn't process your payout at this time. Your account does not currently meet the eligibility requirements for a welfare payout. Please review your account settings or contact our support team for help." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create payout request: ' + errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, action, approvedAmount, rejectionReason, userId, userRole, overrideEligible, treasurerDecision, treasurerComments, adminApprovalReason } = body;
    
    const payout = await WelfarePayout.findById(id);
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }
    
    if (action === 'approve-admin') {
      // Stage 1: Administrator approval
      if (!overrideEligible) {
        const eligibility = await verifyMemberEligibility(payout.member.toString());
        
        if (!eligibility.isEligible) {
          return NextResponse.json({ 
            error: 'Member does not meet eligibility requirements',
            eligibilityDetails: eligibility
          }, { status: 400 });
        }
      }

      const settings = await getEligibilitySettings();
      const limitKey = `limit${payout.eventType}`;
      const maxLimit = settings[limitKey] || EVENT_LIMITS[payout.eventType] || 10000;
      const amount = approvedAmount || Math.min(payout.requestedAmount, maxLimit);
      
      payout.status = 'Approved';
      payout.approvedAmount = amount;
      payout.approvedByName = 'Administrator';
      payout.approvedAt = new Date();
      
      if (overrideEligible) {
        payout.overrideReason = adminApprovalReason || 'Approved by administrator with override';
        payout.adminApprovalReason = adminApprovalReason || 'Approved by administrator with override';
      }
      
      // Add to audit log
      payout.auditLog = payout.auditLog || [];
      payout.auditLog.push({
        action: 'Admin Approval',
        performedBy: 'Administrator',
        performedAt: new Date(),
        comments: adminApprovalReason,
        details: { overrideEligible, approvedAmount: amount },
      });
    } else if (action === 'treasurer-decision') {
      // Stage 2: Treasurer decision (approve with override or reject)
      if (payout.status !== 'Approved') {
        return NextResponse.json({ 
          error: 'Payout must be approved by Administrator first' 
        }, { status: 400 });
      }
      
      if (treasurerDecision === 'Approved') {
        payout.status = 'Ready for Payment';
        payout.treasurerDecision = 'Approved';
        payout.treasurerComments = treasurerComments;
        payout.treasurerApprovedAt = new Date();
      } else if (treasurerDecision === 'Declined') {
        payout.status = 'Treasurer Declined';
        payout.treasurerDecision = 'Declined';
        payout.treasurerComments = treasurerComments;
        payout.treasurerApprovedAt = new Date();
      }
      
      // Add to audit log
      payout.auditLog = payout.auditLog || [];
      payout.auditLog.push({
        action: `Treasurer ${treasurerDecision}`,
        performedBy: 'Treasurer',
        performedAt: new Date(),
        comments: treasurerComments,
        details: { adminReason: payout.adminApprovalReason },
      });
    } else if (action === 'approve-treasurer') {
      // Legacy treasurer approval (for backwards compatibility)
      if (payout.status !== 'Approved') {
        return NextResponse.json({ 
          error: 'Payout must be approved by Administrator first' 
        }, { status: 400 });
      }
      
      payout.status = 'Ready for Payment';
      payout.treasurerApprovedBy = 'Treasurer';
      payout.treasurerApprovedAt = new Date();
    } else if (action === 'approve') {
      // Legacy single-step approval (for backwards compatibility)
      if (!overrideEligible) {
        const eligibility = await verifyMemberEligibility(payout.member.toString());
        
        if (!eligibility.isEligible) {
          return NextResponse.json({ 
            error: 'Member does not meet eligibility requirements',
            eligibilityDetails: eligibility
          }, { status: 400 });
        }
      }

      const settings = await getEligibilitySettings();
      const limitKey = `limit${payout.eventType}`;
      const maxLimit = settings[limitKey] || EVENT_LIMITS[payout.eventType] || 10000;
      const amount = approvedAmount || Math.min(payout.requestedAmount, maxLimit);
      
      payout.status = 'Approved';
      payout.approvedAmount = amount;
      payout.approvedByName = userRole === 'treasurer' ? 'Treasurer' : 'Administrator';
      payout.approvedAt = new Date();
      if (overrideEligible) {
        payout.overrideReason = 'Approved by administrator with override';
      }
    } else if (action === 'reject') {
      payout.status = 'Rejected';
      payout.rejectionReason = rejectionReason;
      payout.rejectedAt = new Date();
    } else if (action === 'pay') {
      // Verify eligibility before marking as paid
      const eligibility = await verifyMemberEligibility(payout.member.toString());
      
      if (!eligibility.isEligible) {
        return NextResponse.json({ 
          error: 'Member does not meet eligibility requirements for payout',
          eligibilityDetails: eligibility
        }, { status: 400 });
      }
      
      payout.status = 'Paid';
      payout.paidBy = userId;
      payout.paidAt = new Date();
    } else if (action === 'cancel') {
      payout.status = 'Cancelled';
    }
    
    await payout.save();
    
    const populated = await WelfarePayout.findById(id)
      .populate('member', 'memberId fullName');
    
    return NextResponse.json(populated);
  } catch (error) {
    console.error('Error updating welfare payout:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update payout', details: message }, { status: 500 });
  }
}