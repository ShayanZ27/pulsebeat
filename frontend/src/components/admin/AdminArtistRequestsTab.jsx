import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  BadgeCheck,
} from 'lucide-react';
import {
  useGetAdminArtistRequestsQuery,
  useApproveArtistRequestMutation,
  useRejectArtistRequestMutation,
} from '../../store/api';
import { getDisplayName } from '../../utils/format';
import { showToast } from '../../utils/toast';

export default function AdminArtistRequestsTab({ accentColor, accentTextColor }) {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' | 'history'

  const { data: requests = [], isLoading, refetch } = useGetAdminArtistRequestsQuery({
    status: activeSubTab === 'pending' ? 'pending' : 'all',
  });

  const [approveArtistRequest, { isLoading: approving }] = useApproveArtistRequestMutation();
  const [rejectArtistRequest, { isLoading: rejecting }] = useRejectArtistRequestMutation();

  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const displayRequests = activeSubTab === 'pending'
    ? requests.filter((r) => r.status === 'pending')
    : requests.filter((r) => r.status !== 'pending');

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApprove = async (request) => {
    try {
      await approveArtistRequest(request._id).unwrap();
      showToast.success(`Approved ${getDisplayName(request.user, 'Applicant')} as a Verified Artist!`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to approve request');
    }
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!rejectModalItem) return;

    try {
      await rejectArtistRequest({
        requestId: rejectModalItem._id,
        reason: rejectReason.trim() || 'Your request does not meet our current artist criteria.',
      }).unwrap();

      showToast.success('Artist request rejected');
      setRejectModalItem(null);
      setRejectReason('');
      refetch();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to reject request';
      showToast.error(msg);
      // If already processed or not found, close modal and sync
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('not found')) {
        setRejectModalItem(null);
        setRejectReason('');
        refetch();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-sidebar border border-brd shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
            <BadgeCheck size={14} style={{ color: accentColor }} />
            <span>Artist Verification</span>
          </div>
          <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">
            Artist Verification Requests
          </h2>
          <p className="text-xs md:text-sm text-txt-sec">
            Review listener applications requesting creator accounts to publish music, manage albums, and access the Artist Studio.
          </p>
        </div>

        {/* Sub-Tabs: Pending vs History */}
        <div className="flex items-center gap-2 p-1 bg-elevated rounded-2xl border border-brd shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeSubTab === 'pending'
                ? 'shadow-sm'
                : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'pending' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <Clock size={14} />
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'shadow-sm'
                : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'history' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <ShieldCheck size={14} />
            <span>Application History</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-sidebar border border-brd/50 animate-pulse" />
            ))}
          </div>
        ) : displayRequests.length === 0 ? (
          <div className="py-20 text-center p-8 rounded-3xl bg-sidebar border border-brd">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-brd">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">
              {activeSubTab === 'pending'
                ? 'No Pending Artist Requests'
                : 'No Past Requests Cataloged'}
            </h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto">
              {activeSubTab === 'pending'
                ? 'All creator applications have been reviewed. New applications from listeners will appear here.'
                : 'Past approved and rejected creator applications will be archived here.'}
            </p>
          </div>
        ) : (
          displayRequests.map((request) => {
            const applicant = request.user || {};
            const applicantName = getDisplayName(applicant, applicant.username || 'Applicant');

            return (
              <div
                key={request._id}
                className="p-6 rounded-3xl bg-sidebar border border-brd shadow-sm space-y-5 hover:border-brd/80 transition-all"
              >
                {/* Header: Applicant info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brd/60 pb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={applicant.profilePicture || 'https://picsum.photos/seed/useravatar/80/80'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover bg-elevated border border-brd"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-txt flex items-center gap-1.5">
                        <span>{applicantName}</span>
                        <span className="text-xs font-normal text-txt-muted">(@{applicant.username || 'user'})</span>
                      </h4>
                      <p className="text-xs text-txt-sec flex items-center gap-1 mt-0.5">
                        <Mail size={12} className="text-txt-muted" />
                        <span>{applicant.email || 'No email provided'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-txt-muted font-space">
                      Submitted on {new Date(request.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>

                    <span
                      className={`px-3 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider border ${
                        request.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : request.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Artist Statement Pitch Box */}
                <div className="p-4 rounded-2xl bg-elevated/70 border border-brd/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted">
                    <MessageSquare size={13} style={{ color: accentColor }} />
                    <span>Artist Statement & Musical Pitch</span>
                  </div>
                  <p className="text-xs md:text-sm text-txt leading-relaxed italic whitespace-pre-wrap">
                    "{request.statement || 'No statement provided.'}"
                  </p>
                </div>

                {/* Footer Actions or Resolution Notes */}
                {request.status === 'pending' ? (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={approving || rejecting}
                      onClick={() => {
                        setRejectModalItem(request);
                        setRejectReason('');
                      }}
                      className="px-5 py-2.5 rounded-full text-xs font-space font-bold bg-sidebar hover:bg-red-500/10 border border-brd hover:border-red-500/30 text-txt-sec hover:text-red-400 transition-all cursor-pointer"
                    >
                      Reject Application
                    </button>

                    <button
                      type="button"
                      disabled={approving || rejecting}
                      onClick={() => handleApprove(request)}
                      className="px-6 py-2.5 rounded-full text-xs font-space font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: accentColor, color: accentTextColor }}
                    >
                      <BadgeCheck size={16} /> Approve & Verify Artist
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-txt-muted font-space border-t border-brd/40">
                    <div>
                      {request.status === 'approved' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Approved by Administration
                        </span>
                      ) : (
                        <div className="text-red-400 flex items-start gap-1.5">
                          <XCircle size={14} className="shrink-0 mt-0.5" />
                          <span>Rejection Reason: <strong className="text-txt">{request.rejectionReason || 'None specified'}</strong></span>
                        </div>
                      )}
                    </div>

                    {request.reviewedBy && (
                      <span>
                        Reviewed by: <strong className="text-txt">{getDisplayName(request.reviewedBy, 'Admin')}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-sidebar rounded-3xl border border-brd shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-brd flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center border border-red-500/30">
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-txt">Reject Artist Application</h3>
                  <p className="text-xs text-txt-sec">Provide feedback to the applicant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="w-8 h-8 rounded-full bg-elevated hover:bg-elevated/80 text-txt-sec hover:text-txt flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-2">
                  Reason / Feedback (Optional)
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please provide a link to existing released music or a public portfolio."
                  className="w-full p-3.5 rounded-2xl bg-elevated border border-brd text-txt text-xs placeholder:text-txt-muted focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-space font-bold bg-sidebar border border-brd text-txt hover:bg-elevated transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-5 py-2.5 rounded-full text-xs font-space font-bold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
