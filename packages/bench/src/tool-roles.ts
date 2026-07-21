import type { ToolRole } from '@ashborn-sec/core';

/**
 * The part each evaluation-suite tool plays in a data flow.
 *
 * This map is a deliberate judgement, not a derivation, and it materially
 * shapes what the egress detector measures: an over-broad `egress` inflates
 * apparent risk, and a missing `untrustedSource` hides a real one. It is
 * therefore written out per suite rather than inferred, and each assignment is
 * justified by where that suite's injection vectors actually land.
 *
 * `untrustedSource` means the tool returns content the user did not author, so
 * an attacker may have influenced it. `privateData` means it reads the user's
 * own data. `egress` means it transmits outward or changes state consequentially.
 */
const TOOL_ROLES: Readonly<Record<string, Readonly<Record<string, readonly ToolRole[]>>>> = {
  // Injection vectors: bill text, landlord notices, address changes and
  // incoming transactions, all of which surface through read_file.
  banking: {
    get_balance: ['privateData'],
    get_iban: ['privateData'],
    get_most_recent_transactions: ['privateData'],
    get_scheduled_transactions: ['privateData'],
    get_user_info: ['privateData'],
    read_file: ['untrustedSource'],
    schedule_transaction: ['egress'],
    send_money: ['egress'],
    update_password: ['egress'],
    update_scheduled_transaction: ['egress'],
    update_user_info: ['egress'],
  },

  // Injection vectors: web pages, channel messages and inbox items. Message
  // readers are both a source of attacker text and a source of private data,
  // so they carry two roles.
  slack: {
    add_user_to_channel: ['egress'],
    get_channels: ['privateData'],
    get_users_in_channel: ['privateData'],
    get_webpage: ['untrustedSource'],
    invite_user_to_slack: ['egress'],
    post_webpage: ['egress'],
    read_channel_messages: ['untrustedSource', 'privateData'],
    read_inbox: ['untrustedSource', 'privateData'],
    remove_user_from_slack: ['egress'],
    send_channel_message: ['egress'],
    send_direct_message: ['egress'],
  },

  // Injection vectors sit in hotel, restaurant and car-rental records, so every
  // third-party lookup is an untrusted source. Reservations transmit the user's
  // details to a provider and are therefore egress.
  travel: {
    check_restaurant_opening_hours: ['untrustedSource'],
    get_all_car_rental_companies_in_city: ['untrustedSource'],
    get_all_hotels_in_city: ['untrustedSource'],
    get_all_restaurants_in_city: ['untrustedSource'],
    get_car_fuel_options: ['untrustedSource'],
    get_car_price_per_day: ['untrustedSource'],
    get_car_rental_address: ['untrustedSource'],
    get_car_types_available: ['untrustedSource'],
    get_contact_information_for_restaurants: ['untrustedSource'],
    get_cuisine_type_for_restaurants: ['untrustedSource'],
    get_dietary_restrictions_for_all_restaurants: ['untrustedSource'],
    get_flight_information: ['untrustedSource'],
    get_hotels_address: ['untrustedSource'],
    get_hotels_prices: ['untrustedSource'],
    get_price_for_restaurants: ['untrustedSource'],
    get_rating_reviews_for_car_rental: ['untrustedSource'],
    get_rating_reviews_for_hotels: ['untrustedSource'],
    get_rating_reviews_for_restaurants: ['untrustedSource'],
    get_restaurants_address: ['untrustedSource'],
    get_day_calendar_events: ['privateData'],
    get_user_information: ['privateData'],
    search_calendar_events: ['privateData'],
    cancel_calendar_event: ['egress'],
    create_calendar_event: ['egress'],
    reserve_car_rental: ['egress'],
    reserve_hotel: ['egress'],
    reserve_restaurant: ['egress'],
    send_email: ['egress'],
  },
};

/**
 * Roles for a tool, or an empty list when it is not mapped.
 *
 * An unmapped tool yields no roles rather than a guess, so a gap in this map
 * shows up as an absent signal instead of a fabricated one.
 */
export function rolesForTool(suite: string, toolName: string): ToolRole[] {
  return [...(TOOL_ROLES[suite]?.[toolName] ?? [])];
}
