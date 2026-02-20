import { encodeSeg } from '../../services/endpoints'; // reuse helper

const A = {
  root: () => '/api/admin',
  dashboard: () => '/api/admin/dashboard',
  dashboardRecent: () => '/api/admin/dashboard/recent-bookings',
  dashboardTopAttractions: () => '/api/admin/dashboard/top-attractions',
  dashboardStatus: () => '/api/admin/dashboard/status-breakdown',
  dashboardTrend: () => '/api/admin/dashboard/trend',

  bookings: () => '/api/admin/bookings',
  bookingById: (id) => `/api/admin/bookings/${encodeSeg(id)}`,
  bookingCancel: (id) => `/api/admin/bookings/${encodeSeg(id)}/cancel`,
  bookingResendTicket: (id) => `/api/admin/bookings/${encodeSeg(id)}/resend-ticket`,
  bookingResendWhatsApp: (id) => `/api/admin/bookings/${encodeSeg(id)}/resend-whatsapp`,
  bookingResendEmail: (id) => `/api/admin/bookings/${encodeSeg(id)}/resend-email`,
  payphiStatus: (id) => `/api/admin/bookings/${encodeSeg(id)}/pay/payphi/status`,
  payphiInitiate: (id) => `/api/admin/bookings/${encodeSeg(id)}/pay/payphi/initiate`,
  payphiRefund: (id) => `/api/admin/bookings/${encodeSeg(id)}/pay/payphi/refund`,






  attractions: () => '/api/admin/attractions',
  attractionById: (id) => `/api/admin/attractions/${encodeSeg(id)}`,

  slots: () => '/api/admin/slots',
  slotsBulk: () => '/api/admin/slots/bulk',
  slotById: (id) => `/api/admin/slots/${encodeSeg(id)}`,

  addons: () => '/api/admin/addons',
  coupons: () => '/api/admin/coupons',
  offers: () => '/api/admin/offers',
  dynamicPricing: () => '/api/admin/dynamic-pricing',
  dynamicPricingById: (id) => `/api/admin/dynamic-pricing/${encodeSeg(id)}`,
  attractionDatePrices: (id) => `/api/admin/attraction-date-prices/${encodeSeg(id)}`,
  attractionDatePricesBulk: (id) => `/api/admin/attraction-date-prices/${encodeSeg(id)}/bulk`,
  attractionDatePricesByDate: (id, date) => `/api/admin/attraction-date-prices/${encodeSeg(id)}/${encodeSeg(date)}`,
  comboDatePrices: (id) => `/api/admin/combo-date-prices/${encodeSeg(id)}`,
  comboDatePricesBulk: (id) => `/api/admin/combo-date-prices/${encodeSeg(id)}/bulk`,
  comboDatePricesByDate: (id, date) => `/api/admin/combo-date-prices/${encodeSeg(id)}/${encodeSeg(date)}`,
  combos: () => '/api/admin/combos',
  comboById: (id) => `/api/admin/combos/${encodeSeg(id)}`,
  comboSlots: () => '/api/admin/combo-slots',
  comboSlotById: (id) => `/api/admin/combo-slots/${encodeSeg(id)}`,
  comboSlotsBulk: () => '/api/admin/combo-slots/bulk',
  blogs: () => '/api/admin/blogs',
  blogById: (id) => `/api/admin/blogs/${encodeSeg(id)}`,
  blogPreview: () => '/api/admin/blogs/preview',
  pages: () => '/api/admin/pages',
  pageById: (id) => `/api/admin/pages/${encodeSeg(id)}`,
  pagePreview: () => '/api/admin/pages/preview',
  gallery: () => '/api/admin/gallery',
  galleryById: (id) => `/api/admin/gallery/${encodeSeg(id)}`,
  galleryDelete: (id) => `/api/admin/gallery/${encodeSeg(id)}`,
  galleryBulkDelete: () => '/api/admin/gallery/bulk-delete',
  banners: () => '/api/admin/banners',
  bannerById: (id) => `/api/admin/banners/${encodeSeg(id)}`,
  bannersReorder: () => '/api/admin/banners/reorder',

  users: () => '/api/admin/users',
  userById: (id) => `/api/admin/users/${encodeSeg(id)}`,

  settings: () => '/api/admin/settings',
  settingKey: (key) => `/api/admin/settings/${encodeSeg(key)}`,

  notifications: () => '/api/admin/notifications',
  notificationById: (id) => `/api/admin/notifications/${encodeSeg(id)}`,

  holidays: () => '/api/admin/holidays',
  holidayById: (id) => `/api/admin/holidays/${encodeSeg(id)}`,

  happyHours: () => '/api/admin/happy-hours',
  happyHourById: (id) => `/api/admin/happy-hours/${encodeSeg(id)}`,

  roles: () => '/api/admin/roles',
  roleById: (id) => `/api/admin/roles/${encodeSeg(id)}`,
  rolePerms: (id) => `/api/admin/roles/${encodeSeg(id)}/permissions`,

  permissions: () => '/api/admin/permissions',
  permissionById: (id) => `/api/admin/permissions/${encodeSeg(id)}`,

  analyticsOverview: () => '/api/admin/analytics/overview',
  analyticsTrend: () => '/api/admin/analytics/trend',
  analyticsTopAttractions: () => '/api/admin/analytics/top-attractions',
  analyticsAttractionRevenue: () => '/api/admin/analytics/attraction-revenue',
  analyticsComboRevenue: () => '/api/admin/analytics/combo-revenue',
  analyticsReport: (format = 'csv') => `/api/admin/analytics/report.${format}`,
  analytics: () => '/api/admin/analytics',

  // Conversion tracking
  conversionSummary: () => '/api/admin/conversion/summary',
  conversionAdSpend: () => '/api/admin/conversion/ad-spend',
  conversionAdSpendById: (id) => `/api/admin/conversion/ad-spend/${encodeSeg(id)}`,
};

export const ANALYTICS_ENDPOINTS = {
  OVERVIEW: '/admin/analytics/overview',
  TREND: '/admin/analytics/trend',
  TOP_ATTRACTIONS: '/admin/analytics/top-attractions',
  ATTRACTIONS_BREAKDOWN: '/admin/analytics/attractions-breakdown',
  ATTRACTION_REVENUE: '/admin/analytics/attraction-revenue',
  COMBO_REVENUE: '/admin/analytics/combo-revenue',
  GENERAL: '/admin/analytics',
};

export default A;