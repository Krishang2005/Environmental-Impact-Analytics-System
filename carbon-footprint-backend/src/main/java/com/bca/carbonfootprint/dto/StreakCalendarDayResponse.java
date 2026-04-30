package com.bca.carbonfootprint.dto;

public class StreakCalendarDayResponse {

    private String date;
    private boolean checkedIn;
    private boolean perfectGreenDay;

    public StreakCalendarDayResponse(String date, boolean checkedIn, boolean perfectGreenDay) {
        this.date = date;
        this.checkedIn = checkedIn;
        this.perfectGreenDay = perfectGreenDay;
    }

    public String getDate() {
        return date;
    }

    public boolean isCheckedIn() {
        return checkedIn;
    }

    public boolean isPerfectGreenDay() {
        return perfectGreenDay;
    }
}
