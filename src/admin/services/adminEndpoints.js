import { encodeSeg } from '../../services/endpoints'; // reuse helper

const A = {
  root: () => '/api/parkpanel',
  dashboard: () => '/api/parkpanel/dashboard',
  dashboardRecent: () => '/api/parkpanel/dashboard/recent-bookings',
  dashboardTopAttractions: () => '/api/parkpanel/dashboard/top-attractions',
  dashboardStatus: () => '/api/parkpanel/dashboard/status-breakdown',
  dashboardTrend: () => '/api/parkpanel/dashboard/trend',

  bookings: () => '/api/parkpanel/bookings',
  bookingById: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}`,
  bookingCancel: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/cancel`,
  bookingResendTicket: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/resend-ticket`,
  bookingResendWhatsApp: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/resend-whatsapp`,
  bookingResendEmail: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/resend-email`,
  payphiStatus: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/pay/payphi/status`,
  payphiInitiate: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/pay/payphi/initiate`,
  payphiRefund: (id) => `/api/parkpanel/bookings/${encodeSeg(id)}/pay/payphi/refund`,






  attractions: () => '/api/parkpanel/attractions',
  attractionById: (id) => `/api/parkpanel/attractions/${encodeSeg(id)}`,

  slots: () => '/api/parkpanel/slots',
  slotsBulk: () => '/api/parkpanel/slots/bulk',
  slotById: (id) => `/api/parkpanel/slots/${encodeSeg(id)}`,

  addons: () => '/api/parkpanel/addons',
  coupons: () => '/api/parkpanel/coupons',
  offers: () => '/api/parkpanel/offers',
  announcements: () => '/api/parkpanel/announcements',
  announcementById: (id) => `/api/parkpanel/announcements/${encodeSeg(id)}`,
  dynamicPricing: () => '/api/parkpanel/dynamic-pricing',
  dynamicPricingById: (id) => `/api/parkpanel/dynamic-pricing/${encodeSeg(id)}`,
  attractionDatePrices: (id) => `/api/parkpanel/attraction-date-prices/${encodeSeg(id)}`,
  attractionDatePricesBulk: (id) => `/api/parkpanel/attraction-date-prices/${encodeSeg(id)}/bulk`,
  attractionDatePricesByDate: (id, date) => `/api/parkpanel/attraction-date-prices/${encodeSeg(id)}/${encodeSeg(date)}`,
  comboDatePrices: (id) => `/api/parkpanel/combo-date-prices/${encodeSeg(id)}`,
  comboDatePricesBulk: (id) => `/api/parkpanel/combo-date-prices/${encodeSeg(id)}/bulk`,
  comboDatePricesByDate: (id, date) => `/api/parkpanel/combo-date-prices/${encodeSeg(id)}/${encodeSeg(date)}`,
  combos: () => '/api/parkpanel/combos',
  comboById: (id) => `/api/parkpanel/combos/${encodeSeg(id)}`,
  comboSlots: () => '/api/parkpanel/combo-slots',
  comboSlotById: (id) => `/api/parkpanel/combo-slots/${encodeSeg(id)}`,
  comboSlotsBulk: () => '/api/parkpanel/combo-slots/bulk',
  blogs: () => '/api/parkpanel/blogs',
  blogById: (id) => `/api/parkpanel/blogs/${encodeSeg(id)}`,
  blogPreview: () => '/api/parkpanel/blogs/preview',
  pages: () => '/api/parkpanel/pages',
  pageById: (id) => `/api/parkpanel/pages/${encodeSeg(id)}`,
  pagePreview: () => '/api/parkpanel/pages/preview',
  gallery: () => '/api/parkpanel/gallery',
  galleryById: (id) => `/api/parkpanel/gallery/${encodeSeg(id)}`,
  galleryDelete: (id) => `/api/parkpanel/gallery/${encodeSeg(id)}`,
  galleryBulkDelete: () => '/api/parkpanel/gallery/bulk-delete',
  banners: () => '/api/parkpanel/banners',
  bannerById: (id) => `/api/parkpanel/banners/${encodeSeg(id)}`,
  bannersReorder: () => '/api/parkpanel/banners/reorder',

  users: () => '/api/parkpanel/users',
  userById: (id) => `/api/parkpanel/users/${encodeSeg(id)}`,

  settings: () => '/api/parkpanel/settings',
  settingKey: (key) => `/api/parkpanel/settings/${encodeSeg(key)}`,

  notifications: () => '/api/parkpanel/notifications',
  notificationById: (id) => `/api/parkpanel/notifications/${encodeSeg(id)}`,

  holidays: () => '/api/parkpanel/holidays',
  holidayById: (id) => `/api/parkpanel/holidays/${encodeSeg(id)}`,

  happyHours: () => '/api/parkpanel/happy-hours',
  happyHourById: (id) => `/api/parkpanel/happy-hours/${encodeSeg(id)}`,

  roles: () => '/api/parkpanel/roles',
  roleById: (id) => `/api/parkpanel/roles/${encodeSeg(id)}`,
  rolePerms: (id) => `/api/parkpanel/roles/${encodeSeg(id)}/permissions`,

  permissions: () => '/api/parkpanel/permissions',
  permissionById: (id) => `/api/parkpanel/permissions/${encodeSeg(id)}`,

  analyticsOverview: () => '/api/parkpanel/analytics/overview',
  analyticsTrend: () => '/api/parkpanel/analytics/trend',
  analyticsTopAttractions: () => '/api/parkpanel/analytics/top-attractions',
  analyticsAttractionRevenue: () => '/api/parkpanel/analytics/attraction-revenue',
  analyticsComboRevenue: () => '/api/parkpanel/analytics/combo-revenue',
  analyticsReport: (format = 'csv') => `/api/parkpanel/analytics/report.${format}`,
  analytics: () => '/api/parkpanel/analytics',

  // Conversion tracking
  conversionSummary: () => '/api/parkpanel/conversion/summary',
  conversionAdSpend: () => '/api/parkpanel/conversion/ad-spend',
  conversionAdSpendById: (id) => `/api/parkpanel/conversion/ad-spend/${encodeSeg(id)}`,
};

export const ANALYTICS_ENDPOINTS = {
  OVERVIEW: '/parkpanel/analytics/overview',
  TREND: '/parkpanel/analytics/trend',
  TOP_ATTRACTIONS: '/parkpanel/analytics/top-attractions',
  ATTRACTIONS_BREAKDOWN: '/parkpanel/analytics/attractions-breakdown',
  ATTRACTION_REVENUE: '/parkpanel/analytics/attraction-revenue',
  COMBO_REVENUE: '/parkpanel/analytics/combo-revenue',
  GENERAL: '/parkpanel',
};

export default A;