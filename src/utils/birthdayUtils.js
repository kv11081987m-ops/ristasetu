const todayStr = () => new Date().toISOString().slice(0, 10);

export const isTodayBirthday = (dob) => {
  if (!dob) return false;
  const today = new Date();
  const dobDate = new Date(dob);
  return today.getDate() === dobDate.getDate() && today.getMonth() === dobDate.getMonth();
};

export const getBirthdayBannerKey = (uid) => `rs_bday_banner_${uid}_${todayStr()}`;
export const getBirthdayNotifKey = (uid) => `rs_bday_notif_${uid}_${todayStr()}`;
export const getBirthdayWishKey = (fromUid, toUid) => `rs_bday_wish_${fromUid}_${toUid}_${todayStr()}`;
