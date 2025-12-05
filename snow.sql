--
-- PostgreSQL database dump
--

\restrict ub1mvyWF4xWOsz6Os80afZWGxJV7uRyrPBnKcfOGI87UF1zwpe6oZBZc7MyGyMM

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-03 18:06:10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 18281)
-- Name: public; Type: SCHEMA; Schema: -; Owner: root
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO root;

--
-- TOC entry 4131 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: root
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 18283)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 4133 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 992 (class 1247 OID 18446)
-- Name: api_status; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.api_status AS ENUM (
    'success',
    'failed'
);


ALTER TYPE public.api_status OWNER TO root;

--
-- TOC entry 998 (class 1247 OID 18462)
-- Name: booking_item_type; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.booking_item_type AS ENUM (
    'Attraction',
    'Combo'
);


ALTER TYPE public.booking_item_type OWNER TO root;

--
-- TOC entry 977 (class 1247 OID 18404)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.booking_status AS ENUM (
    'Booked',
    'Redeemed',
    'Expired',
    'Cancelled'
);


ALTER TYPE public.booking_status OWNER TO root;

--
-- TOC entry 995 (class 1247 OID 18452)
-- Name: cart_status; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.cart_status AS ENUM (
    'Open',
    'Paid',
    'Cancelled',
    'Abandoned'
);


ALTER TYPE public.cart_status OWNER TO root;

--
-- TOC entry 989 (class 1247 OID 18436)
-- Name: coupon_type; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.coupon_type AS ENUM (
    'flat',
    'percent',
    'bogo',
    'specific'
);


ALTER TYPE public.coupon_type OWNER TO root;

--
-- TOC entry 980 (class 1247 OID 18414)
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.notification_channel AS ENUM (
    'email',
    'whatsapp'
);


ALTER TYPE public.notification_channel OWNER TO root;

--
-- TOC entry 983 (class 1247 OID 18420)
-- Name: notification_status; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.notification_status AS ENUM (
    'sent',
    'failed',
    'pending'
);


ALTER TYPE public.notification_status OWNER TO root;

--
-- TOC entry 986 (class 1247 OID 18428)
-- Name: offer_rule_type; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.offer_rule_type AS ENUM (
    'holiday',
    'happy_hour',
    'weekday_special',
    'dynamic_pricing',
    'date_slot_pricing'
);


ALTER TYPE public.offer_rule_type OWNER TO root;

--
-- TOC entry 974 (class 1247 OID 18398)
-- Name: payment_mode; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.payment_mode AS ENUM (
    'Online',
    'Offline'
);


ALTER TYPE public.payment_mode OWNER TO root;

--
-- TOC entry 971 (class 1247 OID 18389)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: root
--

CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Completed',
    'Failed',
    'Cancelled'
);


ALTER TYPE public.payment_status OWNER TO root;

--
-- TOC entry 345 (class 1255 OID 18467)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: root
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO root;

--
-- TOC entry 347 (class 1255 OID 19519)
-- Name: update_combo_details(); Type: FUNCTION; Schema: public; Owner: root
--

CREATE FUNCTION public.update_combo_details() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          UPDATE combos 
          SET total_price = (
            SELECT COALESCE(SUM(attraction_price), 0) 
            FROM combo_attractions 
            WHERE combo_id = NEW.combo_id
          )
          WHERE combo_id = NEW.combo_id;
          RETURN COALESCE(NEW, OLD);
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE combos 
          SET total_price = (
            SELECT COALESCE(SUM(attraction_price), 0) 
            FROM combo_attractions 
            WHERE combo_id = OLD.combo_id
          )
          WHERE combo_id = OLD.combo_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$;


ALTER FUNCTION public.update_combo_details() OWNER TO root;

--
-- TOC entry 346 (class 1255 OID 19321)
-- Name: validate_combo_attractions(); Type: FUNCTION; Schema: public; Owner: root
--

CREATE FUNCTION public.validate_combo_attractions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        DECLARE
            current_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO current_count 
            FROM combo_attractions 
            WHERE combo_id = NEW.combo_id;
            
            IF TG_OP = 'INSERT' AND current_count >= 4 THEN
                RAISE EXCEPTION 'Combo cannot have more than 4 attractions';
            END IF;
        END;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.validate_combo_attractions() OWNER TO root;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 241 (class 1259 OID 18727)
-- Name: addons; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.addons (
    addon_id bigint NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    image_url character varying(255),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT addons_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.addons OWNER TO root;

--
-- TOC entry 240 (class 1259 OID 18726)
-- Name: addons_addon_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.addons ALTER COLUMN addon_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.addons_addon_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 271 (class 1259 OID 19193)
-- Name: analytics; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.analytics (
    analytics_id bigint NOT NULL,
    attraction_id bigint NOT NULL,
    total_bookings integer DEFAULT 0 NOT NULL,
    total_people integer DEFAULT 0 NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    report_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT analytics_total_bookings_check CHECK ((total_bookings >= 0)),
    CONSTRAINT analytics_total_people_check CHECK ((total_people >= 0)),
    CONSTRAINT analytics_total_revenue_check CHECK ((total_revenue >= (0)::numeric))
);


ALTER TABLE public.analytics OWNER TO root;

--
-- TOC entry 270 (class 1259 OID 19192)
-- Name: analytics_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.analytics ALTER COLUMN analytics_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.analytics_analytics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 275 (class 1259 OID 19242)
-- Name: api_logs; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.api_logs (
    log_id bigint NOT NULL,
    endpoint character varying(255) NOT NULL,
    payload jsonb,
    response_code integer NOT NULL,
    status public.api_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_logs OWNER TO root;

--
-- TOC entry 274 (class 1259 OID 19241)
-- Name: api_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.api_logs ALTER COLUMN log_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.api_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 18609)
-- Name: attraction_slots; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.attraction_slots (
    slot_id bigint NOT NULL,
    attraction_id bigint NOT NULL,
    slot_code character varying(32) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    capacity integer NOT NULL,
    price numeric(10,2) DEFAULT NULL::numeric,
    available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attraction_slots_capacity_check CHECK ((capacity >= 0))
);


ALTER TABLE public.attraction_slots OWNER TO root;

--
-- TOC entry 234 (class 1259 OID 18608)
-- Name: attraction_slots_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.attraction_slots ALTER COLUMN slot_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attraction_slots_slot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 233 (class 1259 OID 18579)
-- Name: attractions; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.attractions (
    attraction_id bigint NOT NULL,
    title character varying(150) NOT NULL,
    slug public.citext,
    description text,
    image_url character varying(255),
    gallery jsonb DEFAULT '[]'::jsonb,
    base_price numeric(10,2) DEFAULT 0 NOT NULL,
    price_per_hour numeric(10,2) DEFAULT 0,
    discount_percent numeric(5,2) DEFAULT 0,
    active boolean DEFAULT true NOT NULL,
    badge character varying(50),
    video_url character varying(255),
    slot_capacity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attractions_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT attractions_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))),
    CONSTRAINT attractions_price_per_hour_check CHECK ((price_per_hour >= (0)::numeric)),
    CONSTRAINT attractions_slot_capacity_check CHECK ((slot_capacity >= 0))
);


ALTER TABLE public.attractions OWNER TO root;

--
-- TOC entry 232 (class 1259 OID 18578)
-- Name: attractions_attraction_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.attractions ALTER COLUMN attraction_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attractions_attraction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 18871)
-- Name: banners; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.banners (
    banner_id bigint NOT NULL,
    web_image character varying(255),
    mobile_image character varying(255),
    title character varying(100),
    description text,
    linked_attraction_id bigint,
    linked_offer_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.banners OWNER TO root;

--
-- TOC entry 252 (class 1259 OID 18870)
-- Name: banners_banner_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.banners ALTER COLUMN banner_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.banners_banner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 18823)
-- Name: blogs; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.blogs (
    blog_id bigint NOT NULL,
    title character varying(150) NOT NULL,
    slug public.citext NOT NULL,
    content text,
    image_url character varying(255),
    author character varying(100),
    meta_title text,
    meta_description text,
    meta_keywords text,
    editor_mode character varying(10) DEFAULT 'rich'::character varying NOT NULL,
    raw_html text,
    raw_css text,
    raw_js text,
    section_type character varying(20) DEFAULT 'none'::character varying,
    section_ref_id bigint,
    gallery jsonb DEFAULT '[]'::jsonb,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blogs_editor_mode_check CHECK (((editor_mode)::text = ANY ((ARRAY['rich'::character varying, 'raw'::character varying])::text[]))),
    CONSTRAINT blogs_section_type_check CHECK (((section_type)::text = ANY ((ARRAY['none'::character varying, 'attraction'::character varying, 'combo'::character varying, 'offer'::character varying, 'blog'::character varying, 'page'::character varying])::text[]))),
    CONSTRAINT chk_blogs_gallery_array CHECK (((gallery IS NULL) OR (jsonb_typeof(gallery) = 'array'::text)))
);


ALTER TABLE public.blogs OWNER TO root;

--
-- TOC entry 248 (class 1259 OID 18822)
-- Name: blogs_blog_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.blogs ALTER COLUMN blog_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.blogs_blog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 259 (class 1259 OID 19011)
-- Name: booking_addons; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.booking_addons (
    id bigint NOT NULL,
    booking_id bigint NOT NULL,
    addon_id bigint NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT booking_addons_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT booking_addons_quantity_check CHECK ((quantity >= 1))
);


ALTER TABLE public.booking_addons OWNER TO root;

--
-- TOC entry 258 (class 1259 OID 19010)
-- Name: booking_addons_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.booking_addons ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.booking_addons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 283 (class 1259 OID 19331)
-- Name: booking_history; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.booking_history (
    history_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    old_status character varying(50),
    new_status character varying(50) NOT NULL,
    payment_status character varying(50),
    changed_by bigint,
    change_reason character varying(255),
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.booking_history OWNER TO root;

--
-- TOC entry 282 (class 1259 OID 19330)
-- Name: booking_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.booking_history ALTER COLUMN history_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.booking_history_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 18468)
-- Name: booking_ref_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.booking_ref_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booking_ref_seq OWNER TO root;

--
-- TOC entry 257 (class 1259 OID 18925)
-- Name: bookings; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.bookings (
    booking_id bigint NOT NULL,
    booking_ref text DEFAULT (('SC'::text || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD'::text)) || lpad((nextval('public.booking_ref_seq'::regclass))::text, 8, '0'::text)) NOT NULL,
    order_id bigint,
    user_id bigint,
    item_type public.booking_item_type DEFAULT 'Attraction'::public.booking_item_type NOT NULL,
    attraction_id bigint,
    combo_id bigint,
    slot_id bigint,
    combo_slot_id bigint,
    offer_id bigint,
    parent_booking_id bigint,
    quantity integer DEFAULT 1 NOT NULL,
    booking_date date DEFAULT CURRENT_DATE NOT NULL,
    booking_time time without time zone DEFAULT CURRENT_TIME NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    final_amount numeric(10,2) GENERATED ALWAYS AS (GREATEST((total_amount - discount_amount), (0)::numeric)) STORED,
    payment_status public.payment_status DEFAULT 'Pending'::public.payment_status NOT NULL,
    payment_mode public.payment_mode DEFAULT 'Online'::public.payment_mode NOT NULL,
    payment_ref character varying(100),
    booking_status public.booking_status DEFAULT 'Booked'::public.booking_status NOT NULL,
    ticket_pdf character varying(255),
    whatsapp_sent boolean DEFAULT false NOT NULL,
    email_sent boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_txn_no character varying(100),
    booking_status_updated_at timestamp with time zone DEFAULT now(),
    redemption_date date,
    expiry_date date,
    cancel_reason text,
    cancelled_at timestamp with time zone,
    slot_start_time time without time zone DEFAULT '10:00:00'::time without time zone NOT NULL,
    slot_end_time time without time zone DEFAULT '11:00:00'::time without time zone NOT NULL,
    slot_label text,
    CONSTRAINT bookings_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT bookings_quantity_check CHECK ((quantity >= 1)),
    CONSTRAINT bookings_slot_time_valid_range CHECK ((slot_end_time > slot_start_time)),
    CONSTRAINT bookings_total_amount_check CHECK ((total_amount >= (0)::numeric)),
    CONSTRAINT chk_booking_subject CHECK ((((item_type = 'Attraction'::public.booking_item_type) AND (attraction_id IS NOT NULL) AND (combo_id IS NULL)) OR ((item_type = 'Combo'::public.booking_item_type) AND (combo_id IS NOT NULL) AND (attraction_id IS NULL))))
);


ALTER TABLE public.bookings OWNER TO root;

--
-- TOC entry 256 (class 1259 OID 18924)
-- Name: bookings_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.bookings ALTER COLUMN booking_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bookings_booking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 265 (class 1259 OID 19122)
-- Name: cart_bookings; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.cart_bookings (
    id bigint NOT NULL,
    cart_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cart_bookings OWNER TO root;

--
-- TOC entry 264 (class 1259 OID 19121)
-- Name: cart_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.cart_bookings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 263 (class 1259 OID 19077)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.cart_items (
    cart_item_id bigint NOT NULL,
    cart_id bigint NOT NULL,
    item_type character varying(20) NOT NULL,
    attraction_id bigint,
    combo_id bigint,
    offer_id bigint,
    slot_id bigint,
    booking_date date,
    booking_time time without time zone,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['attraction'::character varying, 'combo'::character varying, 'offer'::character varying, 'page'::character varying, 'blog'::character varying])::text[]))),
    CONSTRAINT cart_items_quantity_check CHECK ((quantity >= 1)),
    CONSTRAINT cart_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.cart_items OWNER TO root;

--
-- TOC entry 262 (class 1259 OID 19076)
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.cart_items ALTER COLUMN cart_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_items_cart_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 18469)
-- Name: cart_ref_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.cart_ref_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_ref_seq OWNER TO root;

--
-- TOC entry 261 (class 1259 OID 19041)
-- Name: carts; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.carts (
    cart_id bigint NOT NULL,
    cart_ref text DEFAULT (('SCART'::text || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD'::text)) || lpad((nextval('public.cart_ref_seq'::regclass))::text, 8, '0'::text)) NOT NULL,
    user_id bigint,
    session_id character varying(100),
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    final_amount numeric(10,2) GENERATED ALWAYS AS (GREATEST((total_amount - discount_amount), (0)::numeric)) STORED,
    payment_status public.payment_status DEFAULT 'Pending'::public.payment_status NOT NULL,
    payment_mode public.payment_mode DEFAULT 'Online'::public.payment_mode NOT NULL,
    payment_ref character varying(100),
    payment_txn_no character varying(100),
    status public.cart_status DEFAULT 'Open'::public.cart_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    coupon_code character varying(50),
    abandoned_at timestamp with time zone,
    CONSTRAINT carts_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT carts_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.carts OWNER TO root;

--
-- TOC entry 260 (class 1259 OID 19040)
-- Name: carts_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.carts ALTER COLUMN cart_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.carts_cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 18793)
-- Name: cms_pages; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.cms_pages (
    page_id bigint NOT NULL,
    title character varying(100) NOT NULL,
    slug public.citext NOT NULL,
    content text NOT NULL,
    meta_title text,
    meta_description text,
    meta_keywords text,
    editor_mode character varying(10) DEFAULT 'rich'::character varying NOT NULL,
    raw_html text,
    raw_css text,
    raw_js text,
    nav_group character varying(50),
    nav_order integer DEFAULT 0 NOT NULL,
    placement character varying(30) DEFAULT 'none'::character varying NOT NULL,
    placement_ref_id bigint,
    gallery jsonb DEFAULT '[]'::jsonb,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    section_type character varying(20) DEFAULT 'none'::character varying,
    section_ref_id bigint,
    CONSTRAINT chk_pages_gallery_array CHECK (((gallery IS NULL) OR (jsonb_typeof(gallery) = 'array'::text))),
    CONSTRAINT cms_pages_editor_mode_check CHECK (((editor_mode)::text = ANY ((ARRAY['rich'::character varying, 'raw'::character varying])::text[]))),
    CONSTRAINT cms_pages_placement_check CHECK (((placement)::text = ANY ((ARRAY['none'::character varying, 'home_bottom'::character varying, 'attraction_details'::character varying])::text[]))),
    CONSTRAINT cms_pages_section_type_check CHECK (((section_type)::text = ANY ((ARRAY['none'::character varying, 'attraction'::character varying, 'combo'::character varying, 'offer'::character varying, 'blog'::character varying, 'page'::character varying])::text[])))
);


ALTER TABLE public.cms_pages OWNER TO root;

--
-- TOC entry 246 (class 1259 OID 18792)
-- Name: cms_pages_page_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.cms_pages ALTER COLUMN page_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cms_pages_page_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 18666)
-- Name: combo_attractions; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.combo_attractions (
    combo_attraction_id bigint NOT NULL,
    combo_id bigint NOT NULL,
    attraction_id bigint NOT NULL,
    attraction_price numeric(10,2) NOT NULL,
    position_in_combo integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT combo_attractions_attraction_price_check CHECK ((attraction_price >= (0)::numeric)),
    CONSTRAINT combo_attractions_position_in_combo_check CHECK (((position_in_combo >= 1) AND (position_in_combo <= 4)))
);


ALTER TABLE public.combo_attractions OWNER TO root;

--
-- TOC entry 236 (class 1259 OID 18665)
-- Name: combo_attractions_combo_attraction_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.combo_attractions ALTER COLUMN combo_attraction_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.combo_attractions_combo_attraction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 287 (class 1259 OID 19407)
-- Name: combos; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.combos (
    combo_id bigint NOT NULL,
    attraction_1_id bigint,
    attraction_2_id bigint,
    combo_price numeric(10,2),
    discount_percent numeric(5,2) DEFAULT 0,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    attraction_ids bigint[] DEFAULT '{}'::bigint[],
    attraction_prices jsonb DEFAULT '{}'::jsonb,
    total_price numeric(10,2) DEFAULT 0,
    image_url character varying(255),
    create_slots boolean DEFAULT true,
    CONSTRAINT chk_min_attractions CHECK (((array_length(attraction_ids, 1) IS NULL) OR (array_length(attraction_ids, 1) >= 2))),
    CONSTRAINT combos_combo_price_check CHECK ((combo_price >= (0)::numeric)),
    CONSTRAINT combos_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))),
    CONSTRAINT combos_total_price_check CHECK ((total_price >= (0)::numeric))
);


ALTER TABLE public.combos OWNER TO root;

--
-- TOC entry 288 (class 1259 OID 19514)
-- Name: combo_details; Type: VIEW; Schema: public; Owner: root
--

CREATE VIEW public.combo_details AS
 SELECT c.combo_id,
    c.name,
    c.attraction_ids,
    c.attraction_prices,
    c.total_price,
    c.image_url,
    c.discount_percent,
    c.active,
    c.create_slots,
    c.created_at,
    c.updated_at,
    c.attraction_1_id,
    c.attraction_2_id,
    c.combo_price,
    COALESCE(json_agg(json_build_object('attraction_id', ca.attraction_id, 'title', a.title, 'price', ca.attraction_price, 'image_url', a.image_url, 'slug', a.slug, 'position_in_combo', ca.position_in_combo)) FILTER (WHERE (ca.attraction_id IS NOT NULL)), '[]'::json) AS attractions
   FROM ((public.combos c
     LEFT JOIN public.combo_attractions ca ON ((c.combo_id = ca.combo_id)))
     LEFT JOIN public.attractions a ON ((ca.attraction_id = a.attraction_id)))
  GROUP BY c.combo_id, c.name, c.attraction_ids, c.attraction_prices, c.total_price, c.image_url, c.discount_percent, c.active, c.create_slots, c.created_at, c.updated_at, c.attraction_1_id, c.attraction_2_id, c.combo_price;


ALTER VIEW public.combo_details OWNER TO root;

--
-- TOC entry 239 (class 1259 OID 18695)
-- Name: combo_slots; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.combo_slots (
    combo_slot_id bigint NOT NULL,
    combo_id bigint NOT NULL,
    combo_slot_code character varying(32) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    capacity integer NOT NULL,
    price numeric(10,2) DEFAULT NULL::numeric,
    available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT combo_slots_capacity_check CHECK ((capacity >= 0))
);


ALTER TABLE public.combo_slots OWNER TO root;

--
-- TOC entry 238 (class 1259 OID 18694)
-- Name: combo_slots_combo_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.combo_slots ALTER COLUMN combo_slot_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.combo_slots_combo_slot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 286 (class 1259 OID 19406)
-- Name: combos_combo_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.combos ALTER COLUMN combo_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.combos_combo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 267 (class 1259 OID 19145)
-- Name: coupons; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.coupons (
    coupon_id bigint NOT NULL,
    code public.citext NOT NULL,
    description text,
    type public.coupon_type NOT NULL,
    value numeric(10,2) NOT NULL,
    attraction_id bigint,
    min_amount numeric(10,2) DEFAULT 0 NOT NULL,
    valid_from date NOT NULL,
    valid_to date NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_coupon_dates CHECK ((valid_from <= valid_to)),
    CONSTRAINT coupons_min_amount_check CHECK ((min_amount >= (0)::numeric)),
    CONSTRAINT coupons_value_check CHECK ((value >= (0)::numeric))
);


ALTER TABLE public.coupons OWNER TO root;

--
-- TOC entry 266 (class 1259 OID 19144)
-- Name: coupons_coupon_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.coupons ALTER COLUMN coupon_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.coupons_coupon_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 251 (class 1259 OID 18849)
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.gallery_items (
    gallery_item_id bigint NOT NULL,
    media_type character varying(10) NOT NULL,
    url text NOT NULL,
    title character varying(150),
    description text,
    target_type character varying(20) DEFAULT 'none'::character varying NOT NULL,
    target_ref_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gallery_items_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[]))),
    CONSTRAINT gallery_items_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['none'::character varying, 'attraction'::character varying, 'combo'::character varying])::text[])))
);


ALTER TABLE public.gallery_items OWNER TO root;

--
-- TOC entry 250 (class 1259 OID 18848)
-- Name: gallery_items_gallery_item_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.gallery_items ALTER COLUMN gallery_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.gallery_items_gallery_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 281 (class 1259 OID 19297)
-- Name: happy_hours; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.happy_hours (
    hh_id bigint NOT NULL,
    attraction_id bigint NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_hh_times CHECK ((start_time < end_time)),
    CONSTRAINT happy_hours_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric)))
);


ALTER TABLE public.happy_hours OWNER TO root;

--
-- TOC entry 280 (class 1259 OID 19296)
-- Name: happy_hours_hh_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.happy_hours ALTER COLUMN hh_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.happy_hours_hh_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 279 (class 1259 OID 19283)
-- Name: holidays; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.holidays (
    holiday_id bigint NOT NULL,
    holiday_date date NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.holidays OWNER TO root;

--
-- TOC entry 278 (class 1259 OID 19282)
-- Name: holidays_holiday_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.holidays ALTER COLUMN holiday_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.holidays_holiday_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 269 (class 1259 OID 19177)
-- Name: media_files; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.media_files (
    media_id bigint NOT NULL,
    url_path character varying(255) NOT NULL,
    relative_path character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    size bigint NOT NULL,
    mimetype character varying(100) NOT NULL,
    folder character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.media_files OWNER TO root;

--
-- TOC entry 268 (class 1259 OID 19176)
-- Name: media_files_media_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.media_files ALTER COLUMN media_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.media_files_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 277 (class 1259 OID 19256)
-- Name: notifications; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.notifications (
    notification_id bigint NOT NULL,
    user_id bigint,
    booking_id bigint,
    channel public.notification_channel NOT NULL,
    status public.notification_status DEFAULT 'pending'::public.notification_status NOT NULL,
    message text,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO root;

--
-- TOC entry 276 (class 1259 OID 19255)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.notifications ALTER COLUMN notification_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notifications_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 245 (class 1259 OID 18766)
-- Name: offer_rules; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.offer_rules (
    rule_id integer NOT NULL,
    offer_id integer NOT NULL,
    target_type character varying(32) NOT NULL,
    target_id integer,
    applies_to_all boolean DEFAULT false NOT NULL,
    date_from date,
    date_to date,
    time_from time without time zone,
    time_to time without time zone,
    slot_type character varying(32),
    slot_id integer,
    rule_discount_type character varying(20),
    rule_discount_value numeric(10,2),
    priority integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    day_type character varying(20) DEFAULT NULL::character varying,
    specific_days integer[],
    is_holiday boolean DEFAULT false,
    specific_date date,
    specific_time time without time zone,
    CONSTRAINT offer_rules_day_type_check CHECK (((day_type IS NULL) OR ((day_type)::text = ANY ((ARRAY['weekday'::character varying, 'weekend'::character varying, 'holiday'::character varying, 'custom'::character varying])::text[])))),
    CONSTRAINT offer_rules_rule_discount_type_check CHECK (((rule_discount_type)::text = ANY ((ARRAY['percent'::character varying, 'amount'::character varying])::text[]))),
    CONSTRAINT offer_rules_slot_type_check CHECK (((slot_type)::text = ANY ((ARRAY['attraction'::character varying, 'combo'::character varying])::text[]))),
    CONSTRAINT offer_rules_target_required CHECK ((applies_to_all OR (target_id IS NOT NULL))),
    CONSTRAINT offer_rules_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['attraction'::character varying, 'combo'::character varying])::text[])))
);


ALTER TABLE public.offer_rules OWNER TO root;

--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN offer_rules.day_type; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.offer_rules.day_type IS 'Type of day pricing: weekday, weekend, holiday, or custom';


--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN offer_rules.specific_days; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.offer_rules.specific_days IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) for custom day selection';


--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN offer_rules.is_holiday; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.offer_rules.is_holiday IS 'Flag to indicate if this rule applies to holidays only';


--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN offer_rules.specific_date; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.offer_rules.specific_date IS 'Specific date for date-slot pricing (YYYY-MM-DD)';


--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN offer_rules.specific_time; Type: COMMENT; Schema: public; Owner: root
--

COMMENT ON COLUMN public.offer_rules.specific_time IS 'Specific time for date-slot pricing (HH:MM:SS)';


--
-- TOC entry 244 (class 1259 OID 18765)
-- Name: offer_rules_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.offer_rules_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_rules_rule_id_seq OWNER TO root;

--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 244
-- Name: offer_rules_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.offer_rules_rule_id_seq OWNED BY public.offer_rules.rule_id;


--
-- TOC entry 243 (class 1259 OID 18746)
-- Name: offers; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.offers (
    offer_id bigint NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    image_url character varying(255),
    rule_type public.offer_rule_type,
    discount_type character varying(20) DEFAULT 'percent'::character varying NOT NULL,
    discount_value numeric(10,2) DEFAULT 0,
    max_discount numeric(10,2),
    valid_from date,
    valid_to date,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.offers OWNER TO root;

--
-- TOC entry 242 (class 1259 OID 18745)
-- Name: offers_offer_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.offers ALTER COLUMN offer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.offers_offer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 255 (class 1259 OID 18896)
-- Name: orders; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.orders (
    order_id bigint NOT NULL,
    order_ref character varying(50) DEFAULT (('ORD'::text || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD'::text)) || "substring"(md5((random())::text), 1, 6)) NOT NULL,
    user_id bigint,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2) GENERATED ALWAYS AS (GREATEST((total_amount - discount_amount), (0)::numeric)) STORED,
    payment_status public.payment_status DEFAULT 'Pending'::public.payment_status NOT NULL,
    payment_mode public.payment_mode DEFAULT 'Online'::public.payment_mode,
    payment_ref character varying(100),
    payment_txn_no character varying(100),
    coupon_code character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO root;

--
-- TOC entry 254 (class 1259 OID 18895)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.orders ALTER COLUMN order_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.orders_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 285 (class 1259 OID 19358)
-- Name: payment_txn_logs; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.payment_txn_logs (
    txn_id bigint NOT NULL,
    booking_id bigint,
    cart_id bigint,
    payment_ref character varying(100),
    payment_txn_no character varying(100),
    gateway character varying(50) DEFAULT 'payphi'::character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'Initiated'::character varying NOT NULL,
    response_code character varying(10),
    response_data jsonb,
    error_message text,
    retries integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_txn_logs OWNER TO root;

--
-- TOC entry 284 (class 1259 OID 19357)
-- Name: payment_txn_logs_txn_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.payment_txn_logs ALTER COLUMN txn_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_txn_logs_txn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 18512)
-- Name: permissions; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.permissions (
    permission_id bigint NOT NULL,
    permission_key public.citext NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO root;

--
-- TOC entry 226 (class 1259 OID 18511)
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.permissions ALTER COLUMN permission_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.permissions_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 18529)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.role_permissions (
    id bigint NOT NULL,
    role_id bigint NOT NULL,
    permission_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO root;

--
-- TOC entry 228 (class 1259 OID 18528)
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.role_permissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.role_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 18495)
-- Name: roles; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    role_name public.citext NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO root;

--
-- TOC entry 224 (class 1259 OID 18494)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 273 (class 1259 OID 19224)
-- Name: settings; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.settings (
    setting_id bigint NOT NULL,
    key_name public.citext NOT NULL,
    key_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO root;

--
-- TOC entry 272 (class 1259 OID 19223)
-- Name: settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.settings ALTER COLUMN setting_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.settings_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 18554)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.user_roles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_roles OWNER TO root;

--
-- TOC entry 230 (class 1259 OID 18553)
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.user_roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 223 (class 1259 OID 18471)
-- Name: users; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email public.citext NOT NULL,
    phone character varying(20),
    password_hash text,
    otp_code character varying(10),
    otp_expires_at timestamp with time zone,
    otp_verified boolean DEFAULT false NOT NULL,
    jwt_token text,
    jwt_expires_at timestamp with time zone,
    last_login_at timestamp with time zone,
    last_ip inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_email_format CHECK ((email OPERATOR(public.~*) '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'::public.citext))
);


ALTER TABLE public.users OWNER TO root;

--
-- TOC entry 222 (class 1259 OID 18470)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3555 (class 2604 OID 18769)
-- Name: offer_rules rule_id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.offer_rules ALTER COLUMN rule_id SET DEFAULT nextval('public.offer_rules_rule_id_seq'::regclass);


--
-- TOC entry 4079 (class 0 OID 18727)
-- Dependencies: 241
-- Data for Name: addons; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.addons (addon_id, title, description, price, discount_percent, image_url, active, created_at, updated_at) FROM stdin;
1	Camera/Devices		50.00	0.00	/uploads/2025/12/03/1764757912237_m8xkaa2r9t.png	t	2025-12-03 10:31:58.164546+00	2025-12-03 10:31:58.164546+00
\.


--
-- TOC entry 4109 (class 0 OID 19193)
-- Dependencies: 271
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.analytics (analytics_id, attraction_id, total_bookings, total_people, total_revenue, report_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4113 (class 0 OID 19242)
-- Dependencies: 275
-- Data for Name: api_logs; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.api_logs (log_id, endpoint, payload, response_code, status, created_at) FROM stdin;
\.


--
-- TOC entry 4073 (class 0 OID 18609)
-- Dependencies: 235
-- Data for Name: attraction_slots; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.attraction_slots (slot_id, attraction_id, slot_code, start_date, end_date, start_time, end_time, capacity, price, available, created_at, updated_at) FROM stdin;
2829	3	3-2025-11-29-1000	2025-11-29	2025-11-29	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2830	3	3-2025-11-29-1100	2025-11-29	2025-11-29	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2831	3	3-2025-11-29-1200	2025-11-29	2025-11-29	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2832	3	3-2025-11-29-1300	2025-11-29	2025-11-29	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2833	3	3-2025-11-29-1400	2025-11-29	2025-11-29	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2834	3	3-2025-11-29-1500	2025-11-29	2025-11-29	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2835	3	3-2025-11-29-1600	2025-11-29	2025-11-29	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2836	3	3-2025-11-29-1700	2025-11-29	2025-11-29	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2837	3	3-2025-11-29-1800	2025-11-29	2025-11-29	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2838	3	3-2025-11-29-1900	2025-11-29	2025-11-29	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2839	3	3-2025-11-30-1000	2025-11-30	2025-11-30	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2840	3	3-2025-11-30-1100	2025-11-30	2025-11-30	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2841	3	3-2025-11-30-1200	2025-11-30	2025-11-30	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2842	3	3-2025-11-30-1300	2025-11-30	2025-11-30	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2843	3	3-2025-11-30-1400	2025-11-30	2025-11-30	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2844	3	3-2025-11-30-1500	2025-11-30	2025-11-30	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2845	3	3-2025-11-30-1600	2025-11-30	2025-11-30	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2846	3	3-2025-11-30-1700	2025-11-30	2025-11-30	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2847	3	3-2025-11-30-1800	2025-11-30	2025-11-30	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2848	3	3-2025-11-30-1900	2025-11-30	2025-11-30	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2849	3	3-2025-12-01-1000	2025-12-01	2025-12-01	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2850	3	3-2025-12-01-1100	2025-12-01	2025-12-01	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2851	3	3-2025-12-01-1200	2025-12-01	2025-12-01	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2852	3	3-2025-12-01-1300	2025-12-01	2025-12-01	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2853	3	3-2025-12-01-1400	2025-12-01	2025-12-01	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2854	3	3-2025-12-01-1500	2025-12-01	2025-12-01	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2855	3	3-2025-12-01-1600	2025-12-01	2025-12-01	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2856	3	3-2025-12-01-1700	2025-12-01	2025-12-01	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2857	3	3-2025-12-01-1800	2025-12-01	2025-12-01	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2858	3	3-2025-12-01-1900	2025-12-01	2025-12-01	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2859	3	3-2025-12-02-1000	2025-12-02	2025-12-02	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2860	3	3-2025-12-02-1100	2025-12-02	2025-12-02	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2861	3	3-2025-12-02-1200	2025-12-02	2025-12-02	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2862	3	3-2025-12-02-1300	2025-12-02	2025-12-02	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2863	3	3-2025-12-02-1400	2025-12-02	2025-12-02	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2864	3	3-2025-12-02-1500	2025-12-02	2025-12-02	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2865	3	3-2025-12-02-1600	2025-12-02	2025-12-02	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2866	3	3-2025-12-02-1700	2025-12-02	2025-12-02	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2867	3	3-2025-12-02-1800	2025-12-02	2025-12-02	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2868	3	3-2025-12-02-1900	2025-12-02	2025-12-02	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2869	3	3-2025-12-03-1000	2025-12-03	2025-12-03	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2870	3	3-2025-12-03-1100	2025-12-03	2025-12-03	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2871	3	3-2025-12-03-1200	2025-12-03	2025-12-03	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2872	3	3-2025-12-03-1300	2025-12-03	2025-12-03	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2873	3	3-2025-12-03-1400	2025-12-03	2025-12-03	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2874	3	3-2025-12-03-1500	2025-12-03	2025-12-03	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2875	3	3-2025-12-03-1600	2025-12-03	2025-12-03	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2876	3	3-2025-12-03-1700	2025-12-03	2025-12-03	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2877	3	3-2025-12-03-1800	2025-12-03	2025-12-03	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2878	3	3-2025-12-03-1900	2025-12-03	2025-12-03	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2879	3	3-2025-12-04-1000	2025-12-04	2025-12-04	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2880	3	3-2025-12-04-1100	2025-12-04	2025-12-04	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2881	3	3-2025-12-04-1200	2025-12-04	2025-12-04	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2882	3	3-2025-12-04-1300	2025-12-04	2025-12-04	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2883	3	3-2025-12-04-1400	2025-12-04	2025-12-04	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2884	3	3-2025-12-04-1500	2025-12-04	2025-12-04	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2885	3	3-2025-12-04-1600	2025-12-04	2025-12-04	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2886	3	3-2025-12-04-1700	2025-12-04	2025-12-04	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2887	3	3-2025-12-04-1800	2025-12-04	2025-12-04	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2888	3	3-2025-12-04-1900	2025-12-04	2025-12-04	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2889	3	3-2025-12-05-1000	2025-12-05	2025-12-05	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2890	3	3-2025-12-05-1100	2025-12-05	2025-12-05	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2891	3	3-2025-12-05-1200	2025-12-05	2025-12-05	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2892	3	3-2025-12-05-1300	2025-12-05	2025-12-05	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2893	3	3-2025-12-05-1400	2025-12-05	2025-12-05	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2894	3	3-2025-12-05-1500	2025-12-05	2025-12-05	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2895	3	3-2025-12-05-1600	2025-12-05	2025-12-05	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2896	3	3-2025-12-05-1700	2025-12-05	2025-12-05	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2897	3	3-2025-12-05-1800	2025-12-05	2025-12-05	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2898	3	3-2025-12-05-1900	2025-12-05	2025-12-05	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2899	3	3-2025-12-06-1000	2025-12-06	2025-12-06	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2900	3	3-2025-12-06-1100	2025-12-06	2025-12-06	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2901	3	3-2025-12-06-1200	2025-12-06	2025-12-06	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2902	3	3-2025-12-06-1300	2025-12-06	2025-12-06	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2903	3	3-2025-12-06-1400	2025-12-06	2025-12-06	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2904	3	3-2025-12-06-1500	2025-12-06	2025-12-06	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2905	3	3-2025-12-06-1600	2025-12-06	2025-12-06	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2906	3	3-2025-12-06-1700	2025-12-06	2025-12-06	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2907	3	3-2025-12-06-1800	2025-12-06	2025-12-06	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2908	3	3-2025-12-06-1900	2025-12-06	2025-12-06	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2909	3	3-2025-12-07-1000	2025-12-07	2025-12-07	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2910	3	3-2025-12-07-1100	2025-12-07	2025-12-07	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2911	3	3-2025-12-07-1200	2025-12-07	2025-12-07	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2912	3	3-2025-12-07-1300	2025-12-07	2025-12-07	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2913	3	3-2025-12-07-1400	2025-12-07	2025-12-07	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2914	3	3-2025-12-07-1500	2025-12-07	2025-12-07	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2915	3	3-2025-12-07-1600	2025-12-07	2025-12-07	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2916	3	3-2025-12-07-1700	2025-12-07	2025-12-07	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2917	3	3-2025-12-07-1800	2025-12-07	2025-12-07	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2918	3	3-2025-12-07-1900	2025-12-07	2025-12-07	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2919	3	3-2025-12-08-1000	2025-12-08	2025-12-08	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2920	3	3-2025-12-08-1100	2025-12-08	2025-12-08	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2921	3	3-2025-12-08-1200	2025-12-08	2025-12-08	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2922	3	3-2025-12-08-1300	2025-12-08	2025-12-08	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2923	3	3-2025-12-08-1400	2025-12-08	2025-12-08	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2924	3	3-2025-12-08-1500	2025-12-08	2025-12-08	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2925	3	3-2025-12-08-1600	2025-12-08	2025-12-08	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2926	3	3-2025-12-08-1700	2025-12-08	2025-12-08	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2927	3	3-2025-12-08-1800	2025-12-08	2025-12-08	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2928	3	3-2025-12-08-1900	2025-12-08	2025-12-08	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2929	3	3-2025-12-09-1000	2025-12-09	2025-12-09	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2930	3	3-2025-12-09-1100	2025-12-09	2025-12-09	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2931	3	3-2025-12-09-1200	2025-12-09	2025-12-09	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2932	3	3-2025-12-09-1300	2025-12-09	2025-12-09	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2933	3	3-2025-12-09-1400	2025-12-09	2025-12-09	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2934	3	3-2025-12-09-1500	2025-12-09	2025-12-09	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2935	3	3-2025-12-09-1600	2025-12-09	2025-12-09	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2936	3	3-2025-12-09-1700	2025-12-09	2025-12-09	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2937	3	3-2025-12-09-1800	2025-12-09	2025-12-09	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2938	3	3-2025-12-09-1900	2025-12-09	2025-12-09	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2939	3	3-2025-12-10-1000	2025-12-10	2025-12-10	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2940	3	3-2025-12-10-1100	2025-12-10	2025-12-10	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2941	3	3-2025-12-10-1200	2025-12-10	2025-12-10	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2942	3	3-2025-12-10-1300	2025-12-10	2025-12-10	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2943	3	3-2025-12-10-1400	2025-12-10	2025-12-10	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2944	3	3-2025-12-10-1500	2025-12-10	2025-12-10	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2945	3	3-2025-12-10-1600	2025-12-10	2025-12-10	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2946	3	3-2025-12-10-1700	2025-12-10	2025-12-10	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2947	3	3-2025-12-10-1800	2025-12-10	2025-12-10	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2948	3	3-2025-12-10-1900	2025-12-10	2025-12-10	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2949	3	3-2025-12-11-1000	2025-12-11	2025-12-11	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2950	3	3-2025-12-11-1100	2025-12-11	2025-12-11	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2951	3	3-2025-12-11-1200	2025-12-11	2025-12-11	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2952	3	3-2025-12-11-1300	2025-12-11	2025-12-11	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2953	3	3-2025-12-11-1400	2025-12-11	2025-12-11	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2954	3	3-2025-12-11-1500	2025-12-11	2025-12-11	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2955	3	3-2025-12-11-1600	2025-12-11	2025-12-11	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2956	3	3-2025-12-11-1700	2025-12-11	2025-12-11	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2957	3	3-2025-12-11-1800	2025-12-11	2025-12-11	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2958	3	3-2025-12-11-1900	2025-12-11	2025-12-11	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2959	3	3-2025-12-12-1000	2025-12-12	2025-12-12	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2960	3	3-2025-12-12-1100	2025-12-12	2025-12-12	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2961	3	3-2025-12-12-1200	2025-12-12	2025-12-12	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2962	3	3-2025-12-12-1300	2025-12-12	2025-12-12	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2963	3	3-2025-12-12-1400	2025-12-12	2025-12-12	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2964	3	3-2025-12-12-1500	2025-12-12	2025-12-12	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2965	3	3-2025-12-12-1600	2025-12-12	2025-12-12	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2966	3	3-2025-12-12-1700	2025-12-12	2025-12-12	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2967	3	3-2025-12-12-1800	2025-12-12	2025-12-12	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2968	3	3-2025-12-12-1900	2025-12-12	2025-12-12	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2969	3	3-2025-12-13-1000	2025-12-13	2025-12-13	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2970	3	3-2025-12-13-1100	2025-12-13	2025-12-13	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2971	3	3-2025-12-13-1200	2025-12-13	2025-12-13	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2972	3	3-2025-12-13-1300	2025-12-13	2025-12-13	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2973	3	3-2025-12-13-1400	2025-12-13	2025-12-13	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2974	3	3-2025-12-13-1500	2025-12-13	2025-12-13	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2975	3	3-2025-12-13-1600	2025-12-13	2025-12-13	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2976	3	3-2025-12-13-1700	2025-12-13	2025-12-13	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2977	3	3-2025-12-13-1800	2025-12-13	2025-12-13	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2978	3	3-2025-12-13-1900	2025-12-13	2025-12-13	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2979	3	3-2025-12-14-1000	2025-12-14	2025-12-14	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2980	3	3-2025-12-14-1100	2025-12-14	2025-12-14	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2981	3	3-2025-12-14-1200	2025-12-14	2025-12-14	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2982	3	3-2025-12-14-1300	2025-12-14	2025-12-14	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2983	3	3-2025-12-14-1400	2025-12-14	2025-12-14	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2984	3	3-2025-12-14-1500	2025-12-14	2025-12-14	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2985	3	3-2025-12-14-1600	2025-12-14	2025-12-14	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2986	3	3-2025-12-14-1700	2025-12-14	2025-12-14	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2987	3	3-2025-12-14-1800	2025-12-14	2025-12-14	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2988	3	3-2025-12-14-1900	2025-12-14	2025-12-14	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2989	3	3-2025-12-15-1000	2025-12-15	2025-12-15	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2990	3	3-2025-12-15-1100	2025-12-15	2025-12-15	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2991	3	3-2025-12-15-1200	2025-12-15	2025-12-15	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2992	3	3-2025-12-15-1300	2025-12-15	2025-12-15	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2993	3	3-2025-12-15-1400	2025-12-15	2025-12-15	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2994	3	3-2025-12-15-1500	2025-12-15	2025-12-15	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2995	3	3-2025-12-15-1600	2025-12-15	2025-12-15	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2996	3	3-2025-12-15-1700	2025-12-15	2025-12-15	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2997	3	3-2025-12-15-1800	2025-12-15	2025-12-15	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2998	3	3-2025-12-15-1900	2025-12-15	2025-12-15	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
2999	3	3-2025-12-16-1000	2025-12-16	2025-12-16	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3000	3	3-2025-12-16-1100	2025-12-16	2025-12-16	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3001	3	3-2025-12-16-1200	2025-12-16	2025-12-16	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3002	3	3-2025-12-16-1300	2025-12-16	2025-12-16	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3003	3	3-2025-12-16-1400	2025-12-16	2025-12-16	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3004	3	3-2025-12-16-1500	2025-12-16	2025-12-16	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3005	3	3-2025-12-16-1600	2025-12-16	2025-12-16	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3006	3	3-2025-12-16-1700	2025-12-16	2025-12-16	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3007	3	3-2025-12-16-1800	2025-12-16	2025-12-16	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3008	3	3-2025-12-16-1900	2025-12-16	2025-12-16	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3009	3	3-2025-12-17-1000	2025-12-17	2025-12-17	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3010	3	3-2025-12-17-1100	2025-12-17	2025-12-17	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3011	3	3-2025-12-17-1200	2025-12-17	2025-12-17	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3012	3	3-2025-12-17-1300	2025-12-17	2025-12-17	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3013	3	3-2025-12-17-1400	2025-12-17	2025-12-17	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3014	3	3-2025-12-17-1500	2025-12-17	2025-12-17	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3015	3	3-2025-12-17-1600	2025-12-17	2025-12-17	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3016	3	3-2025-12-17-1700	2025-12-17	2025-12-17	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3017	3	3-2025-12-17-1800	2025-12-17	2025-12-17	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3018	3	3-2025-12-17-1900	2025-12-17	2025-12-17	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3019	3	3-2025-12-18-1000	2025-12-18	2025-12-18	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3020	3	3-2025-12-18-1100	2025-12-18	2025-12-18	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3021	3	3-2025-12-18-1200	2025-12-18	2025-12-18	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3022	3	3-2025-12-18-1300	2025-12-18	2025-12-18	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3023	3	3-2025-12-18-1400	2025-12-18	2025-12-18	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3024	3	3-2025-12-18-1500	2025-12-18	2025-12-18	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3025	3	3-2025-12-18-1600	2025-12-18	2025-12-18	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3026	3	3-2025-12-18-1700	2025-12-18	2025-12-18	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3027	3	3-2025-12-18-1800	2025-12-18	2025-12-18	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3028	3	3-2025-12-18-1900	2025-12-18	2025-12-18	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3029	3	3-2025-12-19-1000	2025-12-19	2025-12-19	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3030	3	3-2025-12-19-1100	2025-12-19	2025-12-19	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3031	3	3-2025-12-19-1200	2025-12-19	2025-12-19	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3032	3	3-2025-12-19-1300	2025-12-19	2025-12-19	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3033	3	3-2025-12-19-1400	2025-12-19	2025-12-19	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3034	3	3-2025-12-19-1500	2025-12-19	2025-12-19	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3035	3	3-2025-12-19-1600	2025-12-19	2025-12-19	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3036	3	3-2025-12-19-1700	2025-12-19	2025-12-19	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3037	3	3-2025-12-19-1800	2025-12-19	2025-12-19	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3038	3	3-2025-12-19-1900	2025-12-19	2025-12-19	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3039	3	3-2025-12-20-1000	2025-12-20	2025-12-20	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3040	3	3-2025-12-20-1100	2025-12-20	2025-12-20	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3041	3	3-2025-12-20-1200	2025-12-20	2025-12-20	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3042	3	3-2025-12-20-1300	2025-12-20	2025-12-20	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3043	3	3-2025-12-20-1400	2025-12-20	2025-12-20	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3044	3	3-2025-12-20-1500	2025-12-20	2025-12-20	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3045	3	3-2025-12-20-1600	2025-12-20	2025-12-20	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3046	3	3-2025-12-20-1700	2025-12-20	2025-12-20	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3047	3	3-2025-12-20-1800	2025-12-20	2025-12-20	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3048	3	3-2025-12-20-1900	2025-12-20	2025-12-20	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3049	3	3-2025-12-21-1000	2025-12-21	2025-12-21	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3050	3	3-2025-12-21-1100	2025-12-21	2025-12-21	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3051	3	3-2025-12-21-1200	2025-12-21	2025-12-21	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3052	3	3-2025-12-21-1300	2025-12-21	2025-12-21	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3053	3	3-2025-12-21-1400	2025-12-21	2025-12-21	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3054	3	3-2025-12-21-1500	2025-12-21	2025-12-21	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3055	3	3-2025-12-21-1600	2025-12-21	2025-12-21	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3056	3	3-2025-12-21-1700	2025-12-21	2025-12-21	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3057	3	3-2025-12-21-1800	2025-12-21	2025-12-21	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3058	3	3-2025-12-21-1900	2025-12-21	2025-12-21	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3059	3	3-2025-12-22-1000	2025-12-22	2025-12-22	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3060	3	3-2025-12-22-1100	2025-12-22	2025-12-22	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3061	3	3-2025-12-22-1200	2025-12-22	2025-12-22	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3062	3	3-2025-12-22-1300	2025-12-22	2025-12-22	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3063	3	3-2025-12-22-1400	2025-12-22	2025-12-22	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3064	3	3-2025-12-22-1500	2025-12-22	2025-12-22	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3065	3	3-2025-12-22-1600	2025-12-22	2025-12-22	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3066	3	3-2025-12-22-1700	2025-12-22	2025-12-22	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3067	3	3-2025-12-22-1800	2025-12-22	2025-12-22	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3068	3	3-2025-12-22-1900	2025-12-22	2025-12-22	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3069	3	3-2025-12-23-1000	2025-12-23	2025-12-23	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3070	3	3-2025-12-23-1100	2025-12-23	2025-12-23	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3071	3	3-2025-12-23-1200	2025-12-23	2025-12-23	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3072	3	3-2025-12-23-1300	2025-12-23	2025-12-23	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3073	3	3-2025-12-23-1400	2025-12-23	2025-12-23	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3074	3	3-2025-12-23-1500	2025-12-23	2025-12-23	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3075	3	3-2025-12-23-1600	2025-12-23	2025-12-23	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3076	3	3-2025-12-23-1700	2025-12-23	2025-12-23	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3077	3	3-2025-12-23-1800	2025-12-23	2025-12-23	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3078	3	3-2025-12-23-1900	2025-12-23	2025-12-23	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3079	3	3-2025-12-24-1000	2025-12-24	2025-12-24	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3080	3	3-2025-12-24-1100	2025-12-24	2025-12-24	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3081	3	3-2025-12-24-1200	2025-12-24	2025-12-24	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3082	3	3-2025-12-24-1300	2025-12-24	2025-12-24	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3083	3	3-2025-12-24-1400	2025-12-24	2025-12-24	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3084	3	3-2025-12-24-1500	2025-12-24	2025-12-24	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3085	3	3-2025-12-24-1600	2025-12-24	2025-12-24	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3086	3	3-2025-12-24-1700	2025-12-24	2025-12-24	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3087	3	3-2025-12-24-1800	2025-12-24	2025-12-24	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3088	3	3-2025-12-24-1900	2025-12-24	2025-12-24	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3089	3	3-2025-12-25-1000	2025-12-25	2025-12-25	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3090	3	3-2025-12-25-1100	2025-12-25	2025-12-25	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3091	3	3-2025-12-25-1200	2025-12-25	2025-12-25	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3092	3	3-2025-12-25-1300	2025-12-25	2025-12-25	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3093	3	3-2025-12-25-1400	2025-12-25	2025-12-25	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3094	3	3-2025-12-25-1500	2025-12-25	2025-12-25	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3095	3	3-2025-12-25-1600	2025-12-25	2025-12-25	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3096	3	3-2025-12-25-1700	2025-12-25	2025-12-25	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3097	3	3-2025-12-25-1800	2025-12-25	2025-12-25	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3098	3	3-2025-12-25-1900	2025-12-25	2025-12-25	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3099	3	3-2025-12-26-1000	2025-12-26	2025-12-26	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3100	3	3-2025-12-26-1100	2025-12-26	2025-12-26	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3101	3	3-2025-12-26-1200	2025-12-26	2025-12-26	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3102	3	3-2025-12-26-1300	2025-12-26	2025-12-26	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3103	3	3-2025-12-26-1400	2025-12-26	2025-12-26	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3104	3	3-2025-12-26-1500	2025-12-26	2025-12-26	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3105	3	3-2025-12-26-1600	2025-12-26	2025-12-26	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3106	3	3-2025-12-26-1700	2025-12-26	2025-12-26	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3107	3	3-2025-12-26-1800	2025-12-26	2025-12-26	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3108	3	3-2025-12-26-1900	2025-12-26	2025-12-26	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3109	3	3-2025-12-27-1000	2025-12-27	2025-12-27	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3110	3	3-2025-12-27-1100	2025-12-27	2025-12-27	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3111	3	3-2025-12-27-1200	2025-12-27	2025-12-27	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3112	3	3-2025-12-27-1300	2025-12-27	2025-12-27	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3113	3	3-2025-12-27-1400	2025-12-27	2025-12-27	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3114	3	3-2025-12-27-1500	2025-12-27	2025-12-27	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3115	3	3-2025-12-27-1600	2025-12-27	2025-12-27	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3116	3	3-2025-12-27-1700	2025-12-27	2025-12-27	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3117	3	3-2025-12-27-1800	2025-12-27	2025-12-27	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3118	3	3-2025-12-27-1900	2025-12-27	2025-12-27	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3119	3	3-2025-12-28-1000	2025-12-28	2025-12-28	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3120	3	3-2025-12-28-1100	2025-12-28	2025-12-28	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3121	3	3-2025-12-28-1200	2025-12-28	2025-12-28	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3122	3	3-2025-12-28-1300	2025-12-28	2025-12-28	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3123	3	3-2025-12-28-1400	2025-12-28	2025-12-28	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3124	3	3-2025-12-28-1500	2025-12-28	2025-12-28	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3125	3	3-2025-12-28-1600	2025-12-28	2025-12-28	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3126	3	3-2025-12-28-1700	2025-12-28	2025-12-28	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3127	3	3-2025-12-28-1800	2025-12-28	2025-12-28	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3128	3	3-2025-12-28-1900	2025-12-28	2025-12-28	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3129	3	3-2025-12-29-1000	2025-12-29	2025-12-29	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3130	3	3-2025-12-29-1100	2025-12-29	2025-12-29	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3131	3	3-2025-12-29-1200	2025-12-29	2025-12-29	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3132	3	3-2025-12-29-1300	2025-12-29	2025-12-29	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3133	3	3-2025-12-29-1400	2025-12-29	2025-12-29	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3134	3	3-2025-12-29-1500	2025-12-29	2025-12-29	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3135	3	3-2025-12-29-1600	2025-12-29	2025-12-29	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3136	3	3-2025-12-29-1700	2025-12-29	2025-12-29	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3137	3	3-2025-12-29-1800	2025-12-29	2025-12-29	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3138	3	3-2025-12-29-1900	2025-12-29	2025-12-29	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3139	3	3-2025-12-30-1000	2025-12-30	2025-12-30	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3140	3	3-2025-12-30-1100	2025-12-30	2025-12-30	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3141	3	3-2025-12-30-1200	2025-12-30	2025-12-30	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3142	3	3-2025-12-30-1300	2025-12-30	2025-12-30	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3143	3	3-2025-12-30-1400	2025-12-30	2025-12-30	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3144	3	3-2025-12-30-1500	2025-12-30	2025-12-30	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3145	3	3-2025-12-30-1600	2025-12-30	2025-12-30	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3146	3	3-2025-12-30-1700	2025-12-30	2025-12-30	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3147	3	3-2025-12-30-1800	2025-12-30	2025-12-30	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3148	3	3-2025-12-30-1900	2025-12-30	2025-12-30	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3149	3	3-2025-12-31-1000	2025-12-31	2025-12-31	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3150	3	3-2025-12-31-1100	2025-12-31	2025-12-31	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3151	3	3-2025-12-31-1200	2025-12-31	2025-12-31	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3152	3	3-2025-12-31-1300	2025-12-31	2025-12-31	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3153	3	3-2025-12-31-1400	2025-12-31	2025-12-31	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3154	3	3-2025-12-31-1500	2025-12-31	2025-12-31	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3155	3	3-2025-12-31-1600	2025-12-31	2025-12-31	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3156	3	3-2025-12-31-1700	2025-12-31	2025-12-31	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3157	3	3-2025-12-31-1800	2025-12-31	2025-12-31	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3158	3	3-2025-12-31-1900	2025-12-31	2025-12-31	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3159	3	3-2026-01-01-1000	2026-01-01	2026-01-01	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3160	3	3-2026-01-01-1100	2026-01-01	2026-01-01	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3161	3	3-2026-01-01-1200	2026-01-01	2026-01-01	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3162	3	3-2026-01-01-1300	2026-01-01	2026-01-01	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3163	3	3-2026-01-01-1400	2026-01-01	2026-01-01	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3164	3	3-2026-01-01-1500	2026-01-01	2026-01-01	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3165	3	3-2026-01-01-1600	2026-01-01	2026-01-01	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3166	3	3-2026-01-01-1700	2026-01-01	2026-01-01	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3167	3	3-2026-01-01-1800	2026-01-01	2026-01-01	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3168	3	3-2026-01-01-1900	2026-01-01	2026-01-01	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3169	3	3-2026-01-02-1000	2026-01-02	2026-01-02	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3170	3	3-2026-01-02-1100	2026-01-02	2026-01-02	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3171	3	3-2026-01-02-1200	2026-01-02	2026-01-02	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3172	3	3-2026-01-02-1300	2026-01-02	2026-01-02	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3173	3	3-2026-01-02-1400	2026-01-02	2026-01-02	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3174	3	3-2026-01-02-1500	2026-01-02	2026-01-02	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3175	3	3-2026-01-02-1600	2026-01-02	2026-01-02	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3176	3	3-2026-01-02-1700	2026-01-02	2026-01-02	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3177	3	3-2026-01-02-1800	2026-01-02	2026-01-02	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3178	3	3-2026-01-02-1900	2026-01-02	2026-01-02	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3179	3	3-2026-01-03-1000	2026-01-03	2026-01-03	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3180	3	3-2026-01-03-1100	2026-01-03	2026-01-03	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3181	3	3-2026-01-03-1200	2026-01-03	2026-01-03	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3182	3	3-2026-01-03-1300	2026-01-03	2026-01-03	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3183	3	3-2026-01-03-1400	2026-01-03	2026-01-03	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3184	3	3-2026-01-03-1500	2026-01-03	2026-01-03	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3185	3	3-2026-01-03-1600	2026-01-03	2026-01-03	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3186	3	3-2026-01-03-1700	2026-01-03	2026-01-03	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3187	3	3-2026-01-03-1800	2026-01-03	2026-01-03	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3188	3	3-2026-01-03-1900	2026-01-03	2026-01-03	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3189	3	3-2026-01-04-1000	2026-01-04	2026-01-04	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3190	3	3-2026-01-04-1100	2026-01-04	2026-01-04	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3191	3	3-2026-01-04-1200	2026-01-04	2026-01-04	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3192	3	3-2026-01-04-1300	2026-01-04	2026-01-04	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3193	3	3-2026-01-04-1400	2026-01-04	2026-01-04	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3194	3	3-2026-01-04-1500	2026-01-04	2026-01-04	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3195	3	3-2026-01-04-1600	2026-01-04	2026-01-04	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3196	3	3-2026-01-04-1700	2026-01-04	2026-01-04	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3197	3	3-2026-01-04-1800	2026-01-04	2026-01-04	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3198	3	3-2026-01-04-1900	2026-01-04	2026-01-04	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3199	3	3-2026-01-05-1000	2026-01-05	2026-01-05	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3200	3	3-2026-01-05-1100	2026-01-05	2026-01-05	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3201	3	3-2026-01-05-1200	2026-01-05	2026-01-05	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3202	3	3-2026-01-05-1300	2026-01-05	2026-01-05	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3203	3	3-2026-01-05-1400	2026-01-05	2026-01-05	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3204	3	3-2026-01-05-1500	2026-01-05	2026-01-05	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3205	3	3-2026-01-05-1600	2026-01-05	2026-01-05	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3206	3	3-2026-01-05-1700	2026-01-05	2026-01-05	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3207	3	3-2026-01-05-1800	2026-01-05	2026-01-05	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3208	3	3-2026-01-05-1900	2026-01-05	2026-01-05	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3209	3	3-2026-01-06-1000	2026-01-06	2026-01-06	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3210	3	3-2026-01-06-1100	2026-01-06	2026-01-06	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3211	3	3-2026-01-06-1200	2026-01-06	2026-01-06	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3212	3	3-2026-01-06-1300	2026-01-06	2026-01-06	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3213	3	3-2026-01-06-1400	2026-01-06	2026-01-06	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3214	3	3-2026-01-06-1500	2026-01-06	2026-01-06	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3215	3	3-2026-01-06-1600	2026-01-06	2026-01-06	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3216	3	3-2026-01-06-1700	2026-01-06	2026-01-06	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3217	3	3-2026-01-06-1800	2026-01-06	2026-01-06	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3218	3	3-2026-01-06-1900	2026-01-06	2026-01-06	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3219	3	3-2026-01-07-1000	2026-01-07	2026-01-07	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3220	3	3-2026-01-07-1100	2026-01-07	2026-01-07	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3221	3	3-2026-01-07-1200	2026-01-07	2026-01-07	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3222	3	3-2026-01-07-1300	2026-01-07	2026-01-07	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3223	3	3-2026-01-07-1400	2026-01-07	2026-01-07	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3224	3	3-2026-01-07-1500	2026-01-07	2026-01-07	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3225	3	3-2026-01-07-1600	2026-01-07	2026-01-07	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3226	3	3-2026-01-07-1700	2026-01-07	2026-01-07	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3227	3	3-2026-01-07-1800	2026-01-07	2026-01-07	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3228	3	3-2026-01-07-1900	2026-01-07	2026-01-07	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3229	3	3-2026-01-08-1000	2026-01-08	2026-01-08	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3230	3	3-2026-01-08-1100	2026-01-08	2026-01-08	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3231	3	3-2026-01-08-1200	2026-01-08	2026-01-08	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3232	3	3-2026-01-08-1300	2026-01-08	2026-01-08	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3233	3	3-2026-01-08-1400	2026-01-08	2026-01-08	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3234	3	3-2026-01-08-1500	2026-01-08	2026-01-08	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3235	3	3-2026-01-08-1600	2026-01-08	2026-01-08	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3236	3	3-2026-01-08-1700	2026-01-08	2026-01-08	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3237	3	3-2026-01-08-1800	2026-01-08	2026-01-08	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3238	3	3-2026-01-08-1900	2026-01-08	2026-01-08	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3239	3	3-2026-01-09-1000	2026-01-09	2026-01-09	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3240	3	3-2026-01-09-1100	2026-01-09	2026-01-09	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3241	3	3-2026-01-09-1200	2026-01-09	2026-01-09	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3242	3	3-2026-01-09-1300	2026-01-09	2026-01-09	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3243	3	3-2026-01-09-1400	2026-01-09	2026-01-09	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3244	3	3-2026-01-09-1500	2026-01-09	2026-01-09	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3245	3	3-2026-01-09-1600	2026-01-09	2026-01-09	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3246	3	3-2026-01-09-1700	2026-01-09	2026-01-09	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3247	3	3-2026-01-09-1800	2026-01-09	2026-01-09	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3248	3	3-2026-01-09-1900	2026-01-09	2026-01-09	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3249	3	3-2026-01-10-1000	2026-01-10	2026-01-10	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3250	3	3-2026-01-10-1100	2026-01-10	2026-01-10	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3251	3	3-2026-01-10-1200	2026-01-10	2026-01-10	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3252	3	3-2026-01-10-1300	2026-01-10	2026-01-10	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3253	3	3-2026-01-10-1400	2026-01-10	2026-01-10	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3254	3	3-2026-01-10-1500	2026-01-10	2026-01-10	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3255	3	3-2026-01-10-1600	2026-01-10	2026-01-10	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3256	3	3-2026-01-10-1700	2026-01-10	2026-01-10	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3257	3	3-2026-01-10-1800	2026-01-10	2026-01-10	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3258	3	3-2026-01-10-1900	2026-01-10	2026-01-10	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3259	3	3-2026-01-11-1000	2026-01-11	2026-01-11	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3260	3	3-2026-01-11-1100	2026-01-11	2026-01-11	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3261	3	3-2026-01-11-1200	2026-01-11	2026-01-11	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3262	3	3-2026-01-11-1300	2026-01-11	2026-01-11	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3263	3	3-2026-01-11-1400	2026-01-11	2026-01-11	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3264	3	3-2026-01-11-1500	2026-01-11	2026-01-11	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3265	3	3-2026-01-11-1600	2026-01-11	2026-01-11	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3266	3	3-2026-01-11-1700	2026-01-11	2026-01-11	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3267	3	3-2026-01-11-1800	2026-01-11	2026-01-11	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3268	3	3-2026-01-11-1900	2026-01-11	2026-01-11	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3269	3	3-2026-01-12-1000	2026-01-12	2026-01-12	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3270	3	3-2026-01-12-1100	2026-01-12	2026-01-12	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3271	3	3-2026-01-12-1200	2026-01-12	2026-01-12	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3272	3	3-2026-01-12-1300	2026-01-12	2026-01-12	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3273	3	3-2026-01-12-1400	2026-01-12	2026-01-12	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3274	3	3-2026-01-12-1500	2026-01-12	2026-01-12	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3275	3	3-2026-01-12-1600	2026-01-12	2026-01-12	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3276	3	3-2026-01-12-1700	2026-01-12	2026-01-12	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3277	3	3-2026-01-12-1800	2026-01-12	2026-01-12	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3278	3	3-2026-01-12-1900	2026-01-12	2026-01-12	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3279	3	3-2026-01-13-1000	2026-01-13	2026-01-13	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3280	3	3-2026-01-13-1100	2026-01-13	2026-01-13	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3281	3	3-2026-01-13-1200	2026-01-13	2026-01-13	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3282	3	3-2026-01-13-1300	2026-01-13	2026-01-13	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3283	3	3-2026-01-13-1400	2026-01-13	2026-01-13	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3284	3	3-2026-01-13-1500	2026-01-13	2026-01-13	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3285	3	3-2026-01-13-1600	2026-01-13	2026-01-13	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3286	3	3-2026-01-13-1700	2026-01-13	2026-01-13	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3287	3	3-2026-01-13-1800	2026-01-13	2026-01-13	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3288	3	3-2026-01-13-1900	2026-01-13	2026-01-13	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3289	3	3-2026-01-14-1000	2026-01-14	2026-01-14	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3290	3	3-2026-01-14-1100	2026-01-14	2026-01-14	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3291	3	3-2026-01-14-1200	2026-01-14	2026-01-14	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3292	3	3-2026-01-14-1300	2026-01-14	2026-01-14	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3293	3	3-2026-01-14-1400	2026-01-14	2026-01-14	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3294	3	3-2026-01-14-1500	2026-01-14	2026-01-14	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3295	3	3-2026-01-14-1600	2026-01-14	2026-01-14	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3296	3	3-2026-01-14-1700	2026-01-14	2026-01-14	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3297	3	3-2026-01-14-1800	2026-01-14	2026-01-14	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3298	3	3-2026-01-14-1900	2026-01-14	2026-01-14	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3299	3	3-2026-01-15-1000	2026-01-15	2026-01-15	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3300	3	3-2026-01-15-1100	2026-01-15	2026-01-15	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3301	3	3-2026-01-15-1200	2026-01-15	2026-01-15	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3302	3	3-2026-01-15-1300	2026-01-15	2026-01-15	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3303	3	3-2026-01-15-1400	2026-01-15	2026-01-15	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3304	3	3-2026-01-15-1500	2026-01-15	2026-01-15	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3305	3	3-2026-01-15-1600	2026-01-15	2026-01-15	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3306	3	3-2026-01-15-1700	2026-01-15	2026-01-15	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3307	3	3-2026-01-15-1800	2026-01-15	2026-01-15	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3308	3	3-2026-01-15-1900	2026-01-15	2026-01-15	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3309	3	3-2026-01-16-1000	2026-01-16	2026-01-16	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3310	3	3-2026-01-16-1100	2026-01-16	2026-01-16	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3311	3	3-2026-01-16-1200	2026-01-16	2026-01-16	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3312	3	3-2026-01-16-1300	2026-01-16	2026-01-16	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3313	3	3-2026-01-16-1400	2026-01-16	2026-01-16	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3314	3	3-2026-01-16-1500	2026-01-16	2026-01-16	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3315	3	3-2026-01-16-1600	2026-01-16	2026-01-16	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3316	3	3-2026-01-16-1700	2026-01-16	2026-01-16	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3317	3	3-2026-01-16-1800	2026-01-16	2026-01-16	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3318	3	3-2026-01-16-1900	2026-01-16	2026-01-16	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3319	3	3-2026-01-17-1000	2026-01-17	2026-01-17	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3320	3	3-2026-01-17-1100	2026-01-17	2026-01-17	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3321	3	3-2026-01-17-1200	2026-01-17	2026-01-17	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3322	3	3-2026-01-17-1300	2026-01-17	2026-01-17	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3323	3	3-2026-01-17-1400	2026-01-17	2026-01-17	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3324	3	3-2026-01-17-1500	2026-01-17	2026-01-17	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3325	3	3-2026-01-17-1600	2026-01-17	2026-01-17	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3326	3	3-2026-01-17-1700	2026-01-17	2026-01-17	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3327	3	3-2026-01-17-1800	2026-01-17	2026-01-17	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3328	3	3-2026-01-17-1900	2026-01-17	2026-01-17	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3329	3	3-2026-01-18-1000	2026-01-18	2026-01-18	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3330	3	3-2026-01-18-1100	2026-01-18	2026-01-18	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3331	3	3-2026-01-18-1200	2026-01-18	2026-01-18	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3332	3	3-2026-01-18-1300	2026-01-18	2026-01-18	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3333	3	3-2026-01-18-1400	2026-01-18	2026-01-18	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3334	3	3-2026-01-18-1500	2026-01-18	2026-01-18	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3335	3	3-2026-01-18-1600	2026-01-18	2026-01-18	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3336	3	3-2026-01-18-1700	2026-01-18	2026-01-18	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3337	3	3-2026-01-18-1800	2026-01-18	2026-01-18	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3338	3	3-2026-01-18-1900	2026-01-18	2026-01-18	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3339	3	3-2026-01-19-1000	2026-01-19	2026-01-19	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3340	3	3-2026-01-19-1100	2026-01-19	2026-01-19	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3341	3	3-2026-01-19-1200	2026-01-19	2026-01-19	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3342	3	3-2026-01-19-1300	2026-01-19	2026-01-19	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3343	3	3-2026-01-19-1400	2026-01-19	2026-01-19	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3344	3	3-2026-01-19-1500	2026-01-19	2026-01-19	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3345	3	3-2026-01-19-1600	2026-01-19	2026-01-19	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3346	3	3-2026-01-19-1700	2026-01-19	2026-01-19	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3347	3	3-2026-01-19-1800	2026-01-19	2026-01-19	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3348	3	3-2026-01-19-1900	2026-01-19	2026-01-19	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3349	3	3-2026-01-20-1000	2026-01-20	2026-01-20	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3350	3	3-2026-01-20-1100	2026-01-20	2026-01-20	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3351	3	3-2026-01-20-1200	2026-01-20	2026-01-20	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3352	3	3-2026-01-20-1300	2026-01-20	2026-01-20	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3353	3	3-2026-01-20-1400	2026-01-20	2026-01-20	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3354	3	3-2026-01-20-1500	2026-01-20	2026-01-20	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3355	3	3-2026-01-20-1600	2026-01-20	2026-01-20	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3356	3	3-2026-01-20-1700	2026-01-20	2026-01-20	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3357	3	3-2026-01-20-1800	2026-01-20	2026-01-20	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3358	3	3-2026-01-20-1900	2026-01-20	2026-01-20	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3359	3	3-2026-01-21-1000	2026-01-21	2026-01-21	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3360	3	3-2026-01-21-1100	2026-01-21	2026-01-21	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3361	3	3-2026-01-21-1200	2026-01-21	2026-01-21	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3362	3	3-2026-01-21-1300	2026-01-21	2026-01-21	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3363	3	3-2026-01-21-1400	2026-01-21	2026-01-21	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3364	3	3-2026-01-21-1500	2026-01-21	2026-01-21	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3365	3	3-2026-01-21-1600	2026-01-21	2026-01-21	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3366	3	3-2026-01-21-1700	2026-01-21	2026-01-21	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3367	3	3-2026-01-21-1800	2026-01-21	2026-01-21	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3368	3	3-2026-01-21-1900	2026-01-21	2026-01-21	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3369	3	3-2026-01-22-1000	2026-01-22	2026-01-22	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3370	3	3-2026-01-22-1100	2026-01-22	2026-01-22	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3371	3	3-2026-01-22-1200	2026-01-22	2026-01-22	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3372	3	3-2026-01-22-1300	2026-01-22	2026-01-22	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3373	3	3-2026-01-22-1400	2026-01-22	2026-01-22	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3374	3	3-2026-01-22-1500	2026-01-22	2026-01-22	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3375	3	3-2026-01-22-1600	2026-01-22	2026-01-22	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3376	3	3-2026-01-22-1700	2026-01-22	2026-01-22	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3377	3	3-2026-01-22-1800	2026-01-22	2026-01-22	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3378	3	3-2026-01-22-1900	2026-01-22	2026-01-22	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3379	3	3-2026-01-23-1000	2026-01-23	2026-01-23	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3380	3	3-2026-01-23-1100	2026-01-23	2026-01-23	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3381	3	3-2026-01-23-1200	2026-01-23	2026-01-23	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3382	3	3-2026-01-23-1300	2026-01-23	2026-01-23	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3383	3	3-2026-01-23-1400	2026-01-23	2026-01-23	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3384	3	3-2026-01-23-1500	2026-01-23	2026-01-23	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3385	3	3-2026-01-23-1600	2026-01-23	2026-01-23	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3386	3	3-2026-01-23-1700	2026-01-23	2026-01-23	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3387	3	3-2026-01-23-1800	2026-01-23	2026-01-23	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3388	3	3-2026-01-23-1900	2026-01-23	2026-01-23	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3389	3	3-2026-01-24-1000	2026-01-24	2026-01-24	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3390	3	3-2026-01-24-1100	2026-01-24	2026-01-24	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3391	3	3-2026-01-24-1200	2026-01-24	2026-01-24	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3392	3	3-2026-01-24-1300	2026-01-24	2026-01-24	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3393	3	3-2026-01-24-1400	2026-01-24	2026-01-24	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3394	3	3-2026-01-24-1500	2026-01-24	2026-01-24	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3395	3	3-2026-01-24-1600	2026-01-24	2026-01-24	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3396	3	3-2026-01-24-1700	2026-01-24	2026-01-24	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3397	3	3-2026-01-24-1800	2026-01-24	2026-01-24	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3398	3	3-2026-01-24-1900	2026-01-24	2026-01-24	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3399	3	3-2026-01-25-1000	2026-01-25	2026-01-25	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3400	3	3-2026-01-25-1100	2026-01-25	2026-01-25	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3401	3	3-2026-01-25-1200	2026-01-25	2026-01-25	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3402	3	3-2026-01-25-1300	2026-01-25	2026-01-25	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3403	3	3-2026-01-25-1400	2026-01-25	2026-01-25	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3404	3	3-2026-01-25-1500	2026-01-25	2026-01-25	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3405	3	3-2026-01-25-1600	2026-01-25	2026-01-25	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3406	3	3-2026-01-25-1700	2026-01-25	2026-01-25	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3407	3	3-2026-01-25-1800	2026-01-25	2026-01-25	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3408	3	3-2026-01-25-1900	2026-01-25	2026-01-25	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3409	3	3-2026-01-26-1000	2026-01-26	2026-01-26	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3410	3	3-2026-01-26-1100	2026-01-26	2026-01-26	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3411	3	3-2026-01-26-1200	2026-01-26	2026-01-26	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3412	3	3-2026-01-26-1300	2026-01-26	2026-01-26	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3413	3	3-2026-01-26-1400	2026-01-26	2026-01-26	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3414	3	3-2026-01-26-1500	2026-01-26	2026-01-26	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3415	3	3-2026-01-26-1600	2026-01-26	2026-01-26	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3416	3	3-2026-01-26-1700	2026-01-26	2026-01-26	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3417	3	3-2026-01-26-1800	2026-01-26	2026-01-26	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3418	3	3-2026-01-26-1900	2026-01-26	2026-01-26	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3419	3	3-2026-01-27-1000	2026-01-27	2026-01-27	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3420	3	3-2026-01-27-1100	2026-01-27	2026-01-27	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3421	3	3-2026-01-27-1200	2026-01-27	2026-01-27	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3422	3	3-2026-01-27-1300	2026-01-27	2026-01-27	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3423	3	3-2026-01-27-1400	2026-01-27	2026-01-27	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3424	3	3-2026-01-27-1500	2026-01-27	2026-01-27	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3425	3	3-2026-01-27-1600	2026-01-27	2026-01-27	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3426	3	3-2026-01-27-1700	2026-01-27	2026-01-27	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3427	3	3-2026-01-27-1800	2026-01-27	2026-01-27	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3428	3	3-2026-01-27-1900	2026-01-27	2026-01-27	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3429	3	3-2026-01-28-1000	2026-01-28	2026-01-28	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3430	3	3-2026-01-28-1100	2026-01-28	2026-01-28	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3431	3	3-2026-01-28-1200	2026-01-28	2026-01-28	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3432	3	3-2026-01-28-1300	2026-01-28	2026-01-28	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3433	3	3-2026-01-28-1400	2026-01-28	2026-01-28	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3434	3	3-2026-01-28-1500	2026-01-28	2026-01-28	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3435	3	3-2026-01-28-1600	2026-01-28	2026-01-28	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3436	3	3-2026-01-28-1700	2026-01-28	2026-01-28	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3437	3	3-2026-01-28-1800	2026-01-28	2026-01-28	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3438	3	3-2026-01-28-1900	2026-01-28	2026-01-28	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3439	3	3-2026-01-29-1000	2026-01-29	2026-01-29	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3440	3	3-2026-01-29-1100	2026-01-29	2026-01-29	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3441	3	3-2026-01-29-1200	2026-01-29	2026-01-29	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3442	3	3-2026-01-29-1300	2026-01-29	2026-01-29	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3443	3	3-2026-01-29-1400	2026-01-29	2026-01-29	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3444	3	3-2026-01-29-1500	2026-01-29	2026-01-29	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3445	3	3-2026-01-29-1600	2026-01-29	2026-01-29	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3446	3	3-2026-01-29-1700	2026-01-29	2026-01-29	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3447	3	3-2026-01-29-1800	2026-01-29	2026-01-29	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3448	3	3-2026-01-29-1900	2026-01-29	2026-01-29	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3449	3	3-2026-01-30-1000	2026-01-30	2026-01-30	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3450	3	3-2026-01-30-1100	2026-01-30	2026-01-30	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3451	3	3-2026-01-30-1200	2026-01-30	2026-01-30	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3452	3	3-2026-01-30-1300	2026-01-30	2026-01-30	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3453	3	3-2026-01-30-1400	2026-01-30	2026-01-30	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3454	3	3-2026-01-30-1500	2026-01-30	2026-01-30	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3455	3	3-2026-01-30-1600	2026-01-30	2026-01-30	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3456	3	3-2026-01-30-1700	2026-01-30	2026-01-30	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3457	3	3-2026-01-30-1800	2026-01-30	2026-01-30	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3458	3	3-2026-01-30-1900	2026-01-30	2026-01-30	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3459	3	3-2026-01-31-1000	2026-01-31	2026-01-31	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3460	3	3-2026-01-31-1100	2026-01-31	2026-01-31	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3461	3	3-2026-01-31-1200	2026-01-31	2026-01-31	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3462	3	3-2026-01-31-1300	2026-01-31	2026-01-31	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3463	3	3-2026-01-31-1400	2026-01-31	2026-01-31	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3464	3	3-2026-01-31-1500	2026-01-31	2026-01-31	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3465	3	3-2026-01-31-1600	2026-01-31	2026-01-31	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3466	3	3-2026-01-31-1700	2026-01-31	2026-01-31	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3467	3	3-2026-01-31-1800	2026-01-31	2026-01-31	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3468	3	3-2026-01-31-1900	2026-01-31	2026-01-31	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3469	3	3-2026-02-01-1000	2026-02-01	2026-02-01	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3470	3	3-2026-02-01-1100	2026-02-01	2026-02-01	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3471	3	3-2026-02-01-1200	2026-02-01	2026-02-01	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3472	3	3-2026-02-01-1300	2026-02-01	2026-02-01	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3473	3	3-2026-02-01-1400	2026-02-01	2026-02-01	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3474	3	3-2026-02-01-1500	2026-02-01	2026-02-01	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3475	3	3-2026-02-01-1600	2026-02-01	2026-02-01	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3476	3	3-2026-02-01-1700	2026-02-01	2026-02-01	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3477	3	3-2026-02-01-1800	2026-02-01	2026-02-01	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3478	3	3-2026-02-01-1900	2026-02-01	2026-02-01	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3479	3	3-2026-02-02-1000	2026-02-02	2026-02-02	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3480	3	3-2026-02-02-1100	2026-02-02	2026-02-02	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3481	3	3-2026-02-02-1200	2026-02-02	2026-02-02	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3482	3	3-2026-02-02-1300	2026-02-02	2026-02-02	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3483	3	3-2026-02-02-1400	2026-02-02	2026-02-02	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3484	3	3-2026-02-02-1500	2026-02-02	2026-02-02	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3485	3	3-2026-02-02-1600	2026-02-02	2026-02-02	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3486	3	3-2026-02-02-1700	2026-02-02	2026-02-02	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3487	3	3-2026-02-02-1800	2026-02-02	2026-02-02	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3488	3	3-2026-02-02-1900	2026-02-02	2026-02-02	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3489	3	3-2026-02-03-1000	2026-02-03	2026-02-03	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3490	3	3-2026-02-03-1100	2026-02-03	2026-02-03	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3491	3	3-2026-02-03-1200	2026-02-03	2026-02-03	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3492	3	3-2026-02-03-1300	2026-02-03	2026-02-03	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3493	3	3-2026-02-03-1400	2026-02-03	2026-02-03	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3494	3	3-2026-02-03-1500	2026-02-03	2026-02-03	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3495	3	3-2026-02-03-1600	2026-02-03	2026-02-03	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3496	3	3-2026-02-03-1700	2026-02-03	2026-02-03	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3497	3	3-2026-02-03-1800	2026-02-03	2026-02-03	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3498	3	3-2026-02-03-1900	2026-02-03	2026-02-03	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3499	3	3-2026-02-04-1000	2026-02-04	2026-02-04	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3500	3	3-2026-02-04-1100	2026-02-04	2026-02-04	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3501	3	3-2026-02-04-1200	2026-02-04	2026-02-04	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3502	3	3-2026-02-04-1300	2026-02-04	2026-02-04	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3503	3	3-2026-02-04-1400	2026-02-04	2026-02-04	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3504	3	3-2026-02-04-1500	2026-02-04	2026-02-04	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3505	3	3-2026-02-04-1600	2026-02-04	2026-02-04	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3506	3	3-2026-02-04-1700	2026-02-04	2026-02-04	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3507	3	3-2026-02-04-1800	2026-02-04	2026-02-04	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3508	3	3-2026-02-04-1900	2026-02-04	2026-02-04	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3509	3	3-2026-02-05-1000	2026-02-05	2026-02-05	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3510	3	3-2026-02-05-1100	2026-02-05	2026-02-05	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3511	3	3-2026-02-05-1200	2026-02-05	2026-02-05	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3512	3	3-2026-02-05-1300	2026-02-05	2026-02-05	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3513	3	3-2026-02-05-1400	2026-02-05	2026-02-05	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3514	3	3-2026-02-05-1500	2026-02-05	2026-02-05	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3515	3	3-2026-02-05-1600	2026-02-05	2026-02-05	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3516	3	3-2026-02-05-1700	2026-02-05	2026-02-05	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3517	3	3-2026-02-05-1800	2026-02-05	2026-02-05	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3518	3	3-2026-02-05-1900	2026-02-05	2026-02-05	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3519	3	3-2026-02-06-1000	2026-02-06	2026-02-06	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3520	3	3-2026-02-06-1100	2026-02-06	2026-02-06	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3521	3	3-2026-02-06-1200	2026-02-06	2026-02-06	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3522	3	3-2026-02-06-1300	2026-02-06	2026-02-06	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3523	3	3-2026-02-06-1400	2026-02-06	2026-02-06	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3524	3	3-2026-02-06-1500	2026-02-06	2026-02-06	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3525	3	3-2026-02-06-1600	2026-02-06	2026-02-06	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3526	3	3-2026-02-06-1700	2026-02-06	2026-02-06	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3527	3	3-2026-02-06-1800	2026-02-06	2026-02-06	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3528	3	3-2026-02-06-1900	2026-02-06	2026-02-06	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3529	3	3-2026-02-07-1000	2026-02-07	2026-02-07	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3530	3	3-2026-02-07-1100	2026-02-07	2026-02-07	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3531	3	3-2026-02-07-1200	2026-02-07	2026-02-07	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3532	3	3-2026-02-07-1300	2026-02-07	2026-02-07	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3533	3	3-2026-02-07-1400	2026-02-07	2026-02-07	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3534	3	3-2026-02-07-1500	2026-02-07	2026-02-07	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3535	3	3-2026-02-07-1600	2026-02-07	2026-02-07	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3536	3	3-2026-02-07-1700	2026-02-07	2026-02-07	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3537	3	3-2026-02-07-1800	2026-02-07	2026-02-07	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3538	3	3-2026-02-07-1900	2026-02-07	2026-02-07	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3539	3	3-2026-02-08-1000	2026-02-08	2026-02-08	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3540	3	3-2026-02-08-1100	2026-02-08	2026-02-08	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3541	3	3-2026-02-08-1200	2026-02-08	2026-02-08	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3542	3	3-2026-02-08-1300	2026-02-08	2026-02-08	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3543	3	3-2026-02-08-1400	2026-02-08	2026-02-08	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3544	3	3-2026-02-08-1500	2026-02-08	2026-02-08	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3545	3	3-2026-02-08-1600	2026-02-08	2026-02-08	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3546	3	3-2026-02-08-1700	2026-02-08	2026-02-08	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3547	3	3-2026-02-08-1800	2026-02-08	2026-02-08	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3548	3	3-2026-02-08-1900	2026-02-08	2026-02-08	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3549	3	3-2026-02-09-1000	2026-02-09	2026-02-09	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3550	3	3-2026-02-09-1100	2026-02-09	2026-02-09	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3551	3	3-2026-02-09-1200	2026-02-09	2026-02-09	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3552	3	3-2026-02-09-1300	2026-02-09	2026-02-09	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3553	3	3-2026-02-09-1400	2026-02-09	2026-02-09	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3554	3	3-2026-02-09-1500	2026-02-09	2026-02-09	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3555	3	3-2026-02-09-1600	2026-02-09	2026-02-09	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3556	3	3-2026-02-09-1700	2026-02-09	2026-02-09	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3557	3	3-2026-02-09-1800	2026-02-09	2026-02-09	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3558	3	3-2026-02-09-1900	2026-02-09	2026-02-09	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3559	3	3-2026-02-10-1000	2026-02-10	2026-02-10	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3560	3	3-2026-02-10-1100	2026-02-10	2026-02-10	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3561	3	3-2026-02-10-1200	2026-02-10	2026-02-10	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3562	3	3-2026-02-10-1300	2026-02-10	2026-02-10	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3563	3	3-2026-02-10-1400	2026-02-10	2026-02-10	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3564	3	3-2026-02-10-1500	2026-02-10	2026-02-10	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3565	3	3-2026-02-10-1600	2026-02-10	2026-02-10	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3566	3	3-2026-02-10-1700	2026-02-10	2026-02-10	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3567	3	3-2026-02-10-1800	2026-02-10	2026-02-10	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3568	3	3-2026-02-10-1900	2026-02-10	2026-02-10	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3569	3	3-2026-02-11-1000	2026-02-11	2026-02-11	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3570	3	3-2026-02-11-1100	2026-02-11	2026-02-11	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3571	3	3-2026-02-11-1200	2026-02-11	2026-02-11	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3572	3	3-2026-02-11-1300	2026-02-11	2026-02-11	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3573	3	3-2026-02-11-1400	2026-02-11	2026-02-11	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3574	3	3-2026-02-11-1500	2026-02-11	2026-02-11	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3575	3	3-2026-02-11-1600	2026-02-11	2026-02-11	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3576	3	3-2026-02-11-1700	2026-02-11	2026-02-11	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3577	3	3-2026-02-11-1800	2026-02-11	2026-02-11	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3578	3	3-2026-02-11-1900	2026-02-11	2026-02-11	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3579	3	3-2026-02-12-1000	2026-02-12	2026-02-12	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3580	3	3-2026-02-12-1100	2026-02-12	2026-02-12	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3581	3	3-2026-02-12-1200	2026-02-12	2026-02-12	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3582	3	3-2026-02-12-1300	2026-02-12	2026-02-12	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3583	3	3-2026-02-12-1400	2026-02-12	2026-02-12	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3584	3	3-2026-02-12-1500	2026-02-12	2026-02-12	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3585	3	3-2026-02-12-1600	2026-02-12	2026-02-12	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3586	3	3-2026-02-12-1700	2026-02-12	2026-02-12	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3587	3	3-2026-02-12-1800	2026-02-12	2026-02-12	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3588	3	3-2026-02-12-1900	2026-02-12	2026-02-12	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3589	3	3-2026-02-13-1000	2026-02-13	2026-02-13	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3590	3	3-2026-02-13-1100	2026-02-13	2026-02-13	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3591	3	3-2026-02-13-1200	2026-02-13	2026-02-13	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3592	3	3-2026-02-13-1300	2026-02-13	2026-02-13	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3593	3	3-2026-02-13-1400	2026-02-13	2026-02-13	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3594	3	3-2026-02-13-1500	2026-02-13	2026-02-13	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3595	3	3-2026-02-13-1600	2026-02-13	2026-02-13	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3596	3	3-2026-02-13-1700	2026-02-13	2026-02-13	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3597	3	3-2026-02-13-1800	2026-02-13	2026-02-13	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3598	3	3-2026-02-13-1900	2026-02-13	2026-02-13	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3599	3	3-2026-02-14-1000	2026-02-14	2026-02-14	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3600	3	3-2026-02-14-1100	2026-02-14	2026-02-14	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3601	3	3-2026-02-14-1200	2026-02-14	2026-02-14	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3602	3	3-2026-02-14-1300	2026-02-14	2026-02-14	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3603	3	3-2026-02-14-1400	2026-02-14	2026-02-14	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3604	3	3-2026-02-14-1500	2026-02-14	2026-02-14	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3605	3	3-2026-02-14-1600	2026-02-14	2026-02-14	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3606	3	3-2026-02-14-1700	2026-02-14	2026-02-14	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3607	3	3-2026-02-14-1800	2026-02-14	2026-02-14	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3608	3	3-2026-02-14-1900	2026-02-14	2026-02-14	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3609	3	3-2026-02-15-1000	2026-02-15	2026-02-15	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3610	3	3-2026-02-15-1100	2026-02-15	2026-02-15	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3611	3	3-2026-02-15-1200	2026-02-15	2026-02-15	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3612	3	3-2026-02-15-1300	2026-02-15	2026-02-15	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3613	3	3-2026-02-15-1400	2026-02-15	2026-02-15	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3614	3	3-2026-02-15-1500	2026-02-15	2026-02-15	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3615	3	3-2026-02-15-1600	2026-02-15	2026-02-15	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3616	3	3-2026-02-15-1700	2026-02-15	2026-02-15	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3617	3	3-2026-02-15-1800	2026-02-15	2026-02-15	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3618	3	3-2026-02-15-1900	2026-02-15	2026-02-15	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3619	3	3-2026-02-16-1000	2026-02-16	2026-02-16	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3620	3	3-2026-02-16-1100	2026-02-16	2026-02-16	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3621	3	3-2026-02-16-1200	2026-02-16	2026-02-16	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3622	3	3-2026-02-16-1300	2026-02-16	2026-02-16	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3623	3	3-2026-02-16-1400	2026-02-16	2026-02-16	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3624	3	3-2026-02-16-1500	2026-02-16	2026-02-16	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3625	3	3-2026-02-16-1600	2026-02-16	2026-02-16	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3626	3	3-2026-02-16-1700	2026-02-16	2026-02-16	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3627	3	3-2026-02-16-1800	2026-02-16	2026-02-16	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3628	3	3-2026-02-16-1900	2026-02-16	2026-02-16	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3629	3	3-2026-02-17-1000	2026-02-17	2026-02-17	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3630	3	3-2026-02-17-1100	2026-02-17	2026-02-17	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3631	3	3-2026-02-17-1200	2026-02-17	2026-02-17	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3632	3	3-2026-02-17-1300	2026-02-17	2026-02-17	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3633	3	3-2026-02-17-1400	2026-02-17	2026-02-17	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3634	3	3-2026-02-17-1500	2026-02-17	2026-02-17	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3635	3	3-2026-02-17-1600	2026-02-17	2026-02-17	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3636	3	3-2026-02-17-1700	2026-02-17	2026-02-17	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3637	3	3-2026-02-17-1800	2026-02-17	2026-02-17	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3638	3	3-2026-02-17-1900	2026-02-17	2026-02-17	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3639	3	3-2026-02-18-1000	2026-02-18	2026-02-18	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3640	3	3-2026-02-18-1100	2026-02-18	2026-02-18	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3641	3	3-2026-02-18-1200	2026-02-18	2026-02-18	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3642	3	3-2026-02-18-1300	2026-02-18	2026-02-18	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3643	3	3-2026-02-18-1400	2026-02-18	2026-02-18	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3644	3	3-2026-02-18-1500	2026-02-18	2026-02-18	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3645	3	3-2026-02-18-1600	2026-02-18	2026-02-18	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3646	3	3-2026-02-18-1700	2026-02-18	2026-02-18	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3647	3	3-2026-02-18-1800	2026-02-18	2026-02-18	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3648	3	3-2026-02-18-1900	2026-02-18	2026-02-18	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3649	3	3-2026-02-19-1000	2026-02-19	2026-02-19	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3650	3	3-2026-02-19-1100	2026-02-19	2026-02-19	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3651	3	3-2026-02-19-1200	2026-02-19	2026-02-19	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3652	3	3-2026-02-19-1300	2026-02-19	2026-02-19	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3653	3	3-2026-02-19-1400	2026-02-19	2026-02-19	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3654	3	3-2026-02-19-1500	2026-02-19	2026-02-19	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3655	3	3-2026-02-19-1600	2026-02-19	2026-02-19	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3656	3	3-2026-02-19-1700	2026-02-19	2026-02-19	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3657	3	3-2026-02-19-1800	2026-02-19	2026-02-19	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3658	3	3-2026-02-19-1900	2026-02-19	2026-02-19	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3659	3	3-2026-02-20-1000	2026-02-20	2026-02-20	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3660	3	3-2026-02-20-1100	2026-02-20	2026-02-20	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3661	3	3-2026-02-20-1200	2026-02-20	2026-02-20	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3662	3	3-2026-02-20-1300	2026-02-20	2026-02-20	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3663	3	3-2026-02-20-1400	2026-02-20	2026-02-20	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3664	3	3-2026-02-20-1500	2026-02-20	2026-02-20	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3665	3	3-2026-02-20-1600	2026-02-20	2026-02-20	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3666	3	3-2026-02-20-1700	2026-02-20	2026-02-20	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3667	3	3-2026-02-20-1800	2026-02-20	2026-02-20	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3668	3	3-2026-02-20-1900	2026-02-20	2026-02-20	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3669	3	3-2026-02-21-1000	2026-02-21	2026-02-21	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3670	3	3-2026-02-21-1100	2026-02-21	2026-02-21	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3671	3	3-2026-02-21-1200	2026-02-21	2026-02-21	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3672	3	3-2026-02-21-1300	2026-02-21	2026-02-21	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3673	3	3-2026-02-21-1400	2026-02-21	2026-02-21	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3674	3	3-2026-02-21-1500	2026-02-21	2026-02-21	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3675	3	3-2026-02-21-1600	2026-02-21	2026-02-21	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3676	3	3-2026-02-21-1700	2026-02-21	2026-02-21	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3677	3	3-2026-02-21-1800	2026-02-21	2026-02-21	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3678	3	3-2026-02-21-1900	2026-02-21	2026-02-21	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3679	3	3-2026-02-22-1000	2026-02-22	2026-02-22	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3680	3	3-2026-02-22-1100	2026-02-22	2026-02-22	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3681	3	3-2026-02-22-1200	2026-02-22	2026-02-22	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3682	3	3-2026-02-22-1300	2026-02-22	2026-02-22	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3683	3	3-2026-02-22-1400	2026-02-22	2026-02-22	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3684	3	3-2026-02-22-1500	2026-02-22	2026-02-22	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3685	3	3-2026-02-22-1600	2026-02-22	2026-02-22	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3686	3	3-2026-02-22-1700	2026-02-22	2026-02-22	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3687	3	3-2026-02-22-1800	2026-02-22	2026-02-22	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3688	3	3-2026-02-22-1900	2026-02-22	2026-02-22	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3689	3	3-2026-02-23-1000	2026-02-23	2026-02-23	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3690	3	3-2026-02-23-1100	2026-02-23	2026-02-23	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3691	3	3-2026-02-23-1200	2026-02-23	2026-02-23	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3692	3	3-2026-02-23-1300	2026-02-23	2026-02-23	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3693	3	3-2026-02-23-1400	2026-02-23	2026-02-23	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3694	3	3-2026-02-23-1500	2026-02-23	2026-02-23	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3695	3	3-2026-02-23-1600	2026-02-23	2026-02-23	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3696	3	3-2026-02-23-1700	2026-02-23	2026-02-23	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3697	3	3-2026-02-23-1800	2026-02-23	2026-02-23	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3698	3	3-2026-02-23-1900	2026-02-23	2026-02-23	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3699	3	3-2026-02-24-1000	2026-02-24	2026-02-24	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3700	3	3-2026-02-24-1100	2026-02-24	2026-02-24	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3701	3	3-2026-02-24-1200	2026-02-24	2026-02-24	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3702	3	3-2026-02-24-1300	2026-02-24	2026-02-24	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3703	3	3-2026-02-24-1400	2026-02-24	2026-02-24	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3704	3	3-2026-02-24-1500	2026-02-24	2026-02-24	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3705	3	3-2026-02-24-1600	2026-02-24	2026-02-24	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3706	3	3-2026-02-24-1700	2026-02-24	2026-02-24	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3707	3	3-2026-02-24-1800	2026-02-24	2026-02-24	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3708	3	3-2026-02-24-1900	2026-02-24	2026-02-24	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3709	3	3-2026-02-25-1000	2026-02-25	2026-02-25	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3710	3	3-2026-02-25-1100	2026-02-25	2026-02-25	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3711	3	3-2026-02-25-1200	2026-02-25	2026-02-25	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3712	3	3-2026-02-25-1300	2026-02-25	2026-02-25	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3713	3	3-2026-02-25-1400	2026-02-25	2026-02-25	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3714	3	3-2026-02-25-1500	2026-02-25	2026-02-25	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3715	3	3-2026-02-25-1600	2026-02-25	2026-02-25	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3716	3	3-2026-02-25-1700	2026-02-25	2026-02-25	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3717	3	3-2026-02-25-1800	2026-02-25	2026-02-25	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3718	3	3-2026-02-25-1900	2026-02-25	2026-02-25	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3719	3	3-2026-02-26-1000	2026-02-26	2026-02-26	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3720	3	3-2026-02-26-1100	2026-02-26	2026-02-26	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3721	3	3-2026-02-26-1200	2026-02-26	2026-02-26	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3722	3	3-2026-02-26-1300	2026-02-26	2026-02-26	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3723	3	3-2026-02-26-1400	2026-02-26	2026-02-26	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3724	3	3-2026-02-26-1500	2026-02-26	2026-02-26	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3725	3	3-2026-02-26-1600	2026-02-26	2026-02-26	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3726	3	3-2026-02-26-1700	2026-02-26	2026-02-26	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3727	3	3-2026-02-26-1800	2026-02-26	2026-02-26	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3728	3	3-2026-02-26-1900	2026-02-26	2026-02-26	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3729	3	3-2026-02-27-1000	2026-02-27	2026-02-27	10:00:00	11:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3730	3	3-2026-02-27-1100	2026-02-27	2026-02-27	11:00:00	12:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3731	3	3-2026-02-27-1200	2026-02-27	2026-02-27	12:00:00	13:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3732	3	3-2026-02-27-1300	2026-02-27	2026-02-27	13:00:00	14:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3733	3	3-2026-02-27-1400	2026-02-27	2026-02-27	14:00:00	15:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3734	3	3-2026-02-27-1500	2026-02-27	2026-02-27	15:00:00	16:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3735	3	3-2026-02-27-1600	2026-02-27	2026-02-27	16:00:00	17:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3736	3	3-2026-02-27-1700	2026-02-27	2026-02-27	17:00:00	18:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3737	3	3-2026-02-27-1800	2026-02-27	2026-02-27	18:00:00	19:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
3738	3	3-2026-02-27-1900	2026-02-27	2026-02-27	19:00:00	20:00:00	300	0.00	t	2025-11-29 12:26:53.347412+00	2025-11-29 12:26:53.347412+00
\.


--
-- TOC entry 4071 (class 0 OID 18579)
-- Dependencies: 233
-- Data for Name: attractions; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.attractions (attraction_id, title, slug, description, image_url, gallery, base_price, price_per_hour, discount_percent, active, badge, video_url, slot_capacity, created_at, updated_at) FROM stdin;
1	SnowCity	\N	let's play with snow	/uploads/2025/11/28/1764329786776_l5r8udk5ben.webp	[]	750.00	0.00	0.00	t	\N	\N	0	2025-11-28 11:36:57.932298+00	2025-11-28 11:36:57.932298+00
2	Madlabs	\N		/uploads/2025/11/28/1764329840112_2h2eyuv0ru9.webp	[]	500.00	0.00	0.00	t	\N	\N	0	2025-11-28 11:37:37.391607+00	2025-11-29 07:17:19.991343+00
3	 EYELUSION	\N		/uploads/2025/11/29/1764419208424_grw9o5ppifk.webp	[]	300.00	0.00	0.00	t	\N	\N	0	2025-11-29 12:26:53.30389+00	2025-11-29 12:26:53.30389+00
\.


--
-- TOC entry 4091 (class 0 OID 18871)
-- Dependencies: 253
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.banners (banner_id, web_image, mobile_image, title, description, linked_attraction_id, linked_offer_id, active, created_at, updated_at) FROM stdin;
1	/uploads/2025/11/28/1764329570056_b0gry0yr36e.webp	/uploads/2025/11/28/1764329582310_zlgsjgysexa.webp			\N	\N	t	2025-11-28 11:33:07.899853+00	2025-11-28 11:33:07.899853+00
2	/uploads/2025/11/28/1764329610307_znjg1r8ngh.png	/uploads/2025/11/28/1764329618769_a218uo0rtok.png			\N	\N	t	2025-11-28 11:33:40.69654+00	2025-11-28 11:33:40.69654+00
3	/uploads/2025/11/28/1764329641502_8xjox2ng028.webp	/uploads/2025/11/28/1764329642524_ee4nsdl1i35.webp			\N	\N	t	2025-11-28 11:34:03.65189+00	2025-11-28 11:34:03.65189+00
\.


--
-- TOC entry 4087 (class 0 OID 18823)
-- Dependencies: 249
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.blogs (blog_id, title, slug, content, image_url, author, meta_title, meta_description, meta_keywords, editor_mode, raw_html, raw_css, raw_js, section_type, section_ref_id, gallery, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4097 (class 0 OID 19011)
-- Dependencies: 259
-- Data for Name: booking_addons; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.booking_addons (id, booking_id, addon_id, quantity, price, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4121 (class 0 OID 19331)
-- Dependencies: 283
-- Data for Name: booking_history; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.booking_history (history_id, booking_id, old_status, new_status, payment_status, changed_by, change_reason, notes, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 4095 (class 0 OID 18925)
-- Dependencies: 257
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.bookings (booking_id, booking_ref, order_id, user_id, item_type, attraction_id, combo_id, slot_id, combo_slot_id, offer_id, parent_booking_id, quantity, booking_date, booking_time, total_amount, discount_amount, payment_status, payment_mode, payment_ref, booking_status, ticket_pdf, whatsapp_sent, email_sent, created_at, updated_at, payment_txn_no, booking_status_updated_at, redemption_date, expiry_date, cancel_reason, cancelled_at, slot_start_time, slot_end_time, slot_label) FROM stdin;
11	SC2025112900000011	10	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	08:56:40.41078	750.00	0.00	Completed	Online	Rf347702c-5572-4be6-9060-7fe04223c58a	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129ce72fc.pdf	f	f	2025-11-29 08:56:40.41078+00	2025-11-29 09:36:55.757991+00	\N	2025-11-29 08:56:40.41078+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
8	SC2025112900000008	7	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	08:13:29.816721	750.00	0.00	Completed	Online	R164698a5-6c22-4999-a600-119f2218b77e	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511299ff7f4.pdf	f	f	2025-11-29 08:13:29.816721+00	2025-11-29 09:36:55.901004+00	\N	2025-11-29 08:13:29.816721+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
7	SC2025112900000007	6	3	Combo	\N	1	\N	\N	\N	\N	2	2025-11-29	08:10:19.409271	1700.00	0.00	Completed	Online	R64d5052b-7e3e-444f-bfe7-e092591a729b	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129829cf6.pdf	f	f	2025-11-29 08:10:19.409271+00	2025-11-29 09:36:55.943041+00	\N	2025-11-29 08:10:19.409271+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
2	SC2025112800000002	2	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-28	13:06:02.81135	1000.00	0.00	Completed	Online	R6337f7f1-5beb-44a4-be00-76531696bbcc	Booked	\N	f	f	2025-11-28 13:06:02.81135+00	2025-11-29 09:36:56.149609+00	\N	2025-11-28 13:06:02.81135+00	\N	\N	\N	\N	13:00:00	14:00:00	1:00 PM - 2:00 PM
1	SC2025112800000001	1	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-28	12:06:28.485718	1500.00	0.00	Completed	Online	R41c51923-6aa1-4a0a-8e1b-b30d12f94f3c	Booked	/uploads/tickets/2025/11/28/ORDER_ORD2025112895158f.pdf	f	f	2025-11-28 12:06:28.485718+00	2025-11-29 09:36:56.199775+00	\N	2025-11-28 12:06:28.485718+00	\N	\N	\N	\N	12:00:00	13:00:00	12:00 PM - 1:00 PM
5	SC2025112900000005	4	3	Combo	\N	1	\N	\N	\N	\N	2	2025-11-29	07:56:26.021288	1700.00	0.00	Completed	Online	R8ac1c0a5-2040-410b-a8a6-17323c8996b4	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129f3386c.pdf	f	f	2025-11-29 07:56:26.021288+00	2025-11-29 09:36:56.027144+00	\N	2025-11-29 07:56:26.021288+00	\N	\N	\N	\N	07:00:00	08:00:00	7:00 AM - 8:00 AM
4	SC2025112900000004	3	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	07:46:36.456974	1500.00	0.00	Completed	Online	R2e551bc8-365c-4837-b379-339822f069e6	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129a806b7.pdf	f	f	2025-11-29 07:46:36.456974+00	2025-11-29 09:36:56.067344+00	\N	2025-11-29 07:46:36.456974+00	\N	\N	\N	\N	07:00:00	08:00:00	7:00 AM - 8:00 AM
3	SC2025112900000003	3	3	Combo	\N	1	\N	\N	\N	\N	1	2025-11-29	07:46:36.456974	850.00	0.00	Completed	Online	R2e551bc8-365c-4837-b379-339822f069e6	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129a806b7.pdf	f	f	2025-11-29 07:46:36.456974+00	2025-11-29 09:36:56.108472+00	\N	2025-11-29 07:46:36.456974+00	\N	\N	\N	\N	07:00:00	08:00:00	7:00 AM - 8:00 AM
22	SC2025112900000022	16	3	Combo	\N	1	\N	\N	\N	\N	1	2025-11-29	10:22:28	850.00	0.00	Completed	Online	R58ebc98c-8f73-412d-83fb-7fe5b42f5745	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129f0856f.pdf	f	f	2025-11-29 10:22:28.6309+00	2025-11-29 10:27:28.041115+00	\N	2025-11-29 10:22:28.6309+00	\N	\N	\N	\N	10:00:00	12:00:00	10:00 AM - 12:00 PM
16	SC2025112900000016	12	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	09:20:34.354901	1000.00	0.00	Completed	Online	R342313dc-fda2-4dc9-b812-ec0b3a859b77	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511296f977f.pdf	f	f	2025-11-29 09:20:34.354901+00	2025-11-29 09:36:55.376257+00	\N	2025-11-29 09:20:34.354901+00	\N	\N	\N	\N	09:00:00	10:00:00	9:00 AM - 10:00 AM
15	SC2025112900000015	12	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	09:20:34.354901	1500.00	0.00	Completed	Online	R342313dc-fda2-4dc9-b812-ec0b3a859b77	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511296f977f.pdf	f	f	2025-11-29 09:20:34.354901+00	2025-11-29 09:36:55.477881+00	\N	2025-11-29 09:20:34.354901+00	\N	\N	\N	\N	09:00:00	10:00:00	9:00 AM - 10:00 AM
14	SC2025112900000014	11	3	Combo	\N	1	\N	\N	\N	\N	1	2025-11-29	09:09:25.97432	850.00	0.00	Completed	Online	R4a13160a-7a44-469c-9156-ddc8b6ce44b9	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112908964b.pdf	f	f	2025-11-29 09:09:25.97432+00	2025-11-29 09:36:55.550242+00	\N	2025-11-29 09:09:25.97432+00	\N	\N	\N	\N	09:00:00	10:00:00	9:00 AM - 10:00 AM
13	SC2025112900000013	11	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	09:09:25.97432	750.00	0.00	Completed	Online	R4a13160a-7a44-469c-9156-ddc8b6ce44b9	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112908964b.pdf	f	f	2025-11-29 09:09:25.97432+00	2025-11-29 09:36:55.654079+00	\N	2025-11-29 09:09:25.97432+00	\N	\N	\N	\N	09:00:00	10:00:00	9:00 AM - 10:00 AM
12	SC2025112900000012	11	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	09:09:25.97432	1000.00	0.00	Completed	Online	R4a13160a-7a44-469c-9156-ddc8b6ce44b9	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112908964b.pdf	f	f	2025-11-29 09:09:25.97432+00	2025-11-29 09:36:55.716005+00	\N	2025-11-29 09:09:25.97432+00	\N	\N	\N	\N	09:00:00	10:00:00	9:00 AM - 10:00 AM
10	SC2025112900000010	9	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	08:47:11.621772	1500.00	0.00	Completed	Online	Rbdbc283d-8339-4783-9236-5b2ea2ae8bb0	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129bd4204.pdf	f	f	2025-11-29 08:47:11.621772+00	2025-11-29 09:36:55.798708+00	\N	2025-11-29 08:47:11.621772+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
9	SC2025112900000009	8	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	08:43:06.404024	1000.00	0.00	Completed	Online	Rccf1d9f2-c9f8-4471-89ae-94c6ed1c6548	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129fb7732.pdf	f	f	2025-11-29 08:43:06.404024+00	2025-11-29 09:36:55.840345+00	\N	2025-11-29 08:43:06.404024+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
6	SC2025112900000006	5	3	Combo	\N	1	\N	\N	\N	\N	1	2025-11-29	08:03:28.451148	850.00	0.00	Completed	Online	Rbff931cb-1904-4e78-a4d2-35a470eedae1	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511293bf09e.pdf	f	f	2025-11-29 08:03:28.451148+00	2025-11-29 09:36:55.986126+00	\N	2025-11-29 08:03:28.451148+00	\N	\N	\N	\N	08:00:00	09:00:00	8:00 AM - 9:00 AM
20	SC2025112900000020	15	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	10:11:06.988885	750.00	0.00	Completed	Online	R76fca161-50f3-46ea-903a-e2454503e387	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112938dfca.pdf	f	f	2025-11-29 10:11:06.988885+00	2025-11-29 10:20:44.043003+00	\N	2025-11-29 10:11:06.988885+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
19	SC2025112900000019	14	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	09:59:52.019749	1000.00	0.00	Completed	Online	R6313042f-df01-40cf-bdd0-cf39590ad028	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511293f4da3.pdf	f	f	2025-11-29 09:59:52.019749+00	2025-11-29 10:20:44.043003+00	\N	2025-11-29 09:59:52.019749+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
18	SC2025112900000018	13	3	Combo	\N	1	\N	\N	\N	\N	2	2025-11-29	09:31:20.01475	1700.00	0.00	Completed	Online	R619841a3-fff6-45b0-9251-86f5e3043db7	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129aa1d2b.pdf	f	f	2025-11-29 09:31:20.01475+00	2025-11-29 10:20:44.043003+00	\N	2025-11-29 09:31:20.01475+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
17	SC2025112900000017	13	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	09:31:20.01475	1500.00	0.00	Completed	Online	R619841a3-fff6-45b0-9251-86f5e3043db7	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129aa1d2b.pdf	f	f	2025-11-29 09:31:20.01475+00	2025-11-29 10:20:44.043003+00	\N	2025-11-29 09:31:20.01475+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
24	SC2025112900000024	18	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	10:43:07.19553	1500.00	0.00	Completed	Online	R3f4af05c-76dc-429c-bf34-d6433c75ea12	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129acee6f.pdf	f	f	2025-11-29 10:43:07.19553+00	2025-11-29 10:44:25.127232+00	\N	2025-11-29 10:43:07.19553+00	\N	\N	\N	\N	10:00:00	11:00:00	\N
21	SC2025112900000021	15	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	10:11:06.988885	750.00	0.00	Completed	Online	R76fca161-50f3-46ea-903a-e2454503e387	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112938dfca.pdf	f	f	2025-11-29 10:11:06.988885+00	2025-11-29 10:20:44.043003+00	\N	2025-11-29 10:11:06.988885+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
23	SC2025112900000023	17	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	10:29:24.275478	1000.00	0.00	Completed	Online	R9c5a0435-f992-4114-8535-b4cefb73ff60	Booked	/uploads/tickets/2025/11/29/ORDER_ORD202511294a9cda.pdf	f	f	2025-11-29 10:29:24.275478+00	2025-11-29 10:30:18.838387+00	\N	2025-11-29 10:29:24.275478+00	\N	\N	\N	\N	10:00:00	11:00:00	\N
25	SC2025112900000025	19	3	Attraction	2	\N	\N	\N	\N	\N	3	2025-11-29	10:49:36.906121	1500.00	0.00	Completed	Online	R292c9c53-654e-4b9a-bcdf-751807467c52	Booked	/uploads/tickets/2025/11/29/ORDER_ORD2025112949f80c.pdf	f	f	2025-11-29 10:49:36.906121+00	2025-11-29 10:50:48.780161+00	\N	2025-11-29 10:49:36.906121+00	\N	\N	\N	\N	10:00:00	11:00:00	\N
27	SC2025112900000027	21	3	Attraction	1	\N	\N	\N	\N	\N	1	2025-11-29	10:57:49.167875	750.00	0.00	Completed	Online	R48c06cd0-256a-48e4-b4ee-e5987509d3d7	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129631f08.pdf	f	f	2025-11-29 10:57:49.167875+00	2025-11-29 11:01:28.431878+00	\N	2025-11-29 10:57:49.167875+00	\N	\N	\N	\N	15:00:00	16:00:00	3:00 PM - 4:00 PM
28	SC2025112900000028	22	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-11-29	11:03:37.359682	1500.00	0.00	Completed	Online	R144f6b36-5a2f-4777-b481-e310e554bb1d	Booked	/uploads/tickets/2025/11/29/ORDER_ORD20251129544579.pdf	f	f	2025-11-29 11:03:37.359682+00	2025-11-29 11:04:47.743534+00	\N	2025-11-29 11:03:37.359682+00	\N	\N	\N	\N	13:00:00	14:00:00	1:00 PM - 2:00 PM
29	SC2025112900000029	22	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-11-29	11:03:37.359682	1000.00	0.00	Completed	Online	R144f6b36-5a2f-4777-b481-e310e554bb1d	Redeemed	/uploads/tickets/2025/11/29/ORDER_ORD20251129544579.pdf	f	f	2025-11-29 11:03:37.359682+00	2025-11-29 11:34:17.877723+00	\N	2025-11-29 11:03:37.359682+00	\N	\N	\N	\N	14:00:00	15:00:00	2:00 PM - 3:00 PM
30	SC2025120300000030	23	3	Attraction	1	\N	\N	\N	\N	\N	2	2025-12-03	06:21:10.039028	1500.00	0.00	Completed	Online	R4d2a5dd9-1552-4ff9-8786-58707c1b137e	Booked	/uploads/tickets/2025/12/03/ORDER_ORD20251203fbb522.pdf	f	f	2025-12-03 06:21:10.039028+00	2025-12-03 06:22:08.750807+00	\N	2025-12-03 06:21:10.039028+00	\N	\N	\N	\N	10:00:00	11:00:00	10:00 AM - 11:00 AM
31	SC2025120300000031	24	3	Combo	\N	1	\N	\N	\N	\N	2	2025-12-03	08:19:07.480882	1700.00	0.00	Completed	Online	R25cac27f-9e86-4b4b-82fe-ec4df19e18e5	Redeemed	/uploads/tickets/2025/12/03/ORDER_ORD202512037c41be.pdf	f	f	2025-12-03 08:19:07.480882+00	2025-12-03 09:20:42.194121+00	\N	2025-12-03 08:19:07.480882+00	\N	\N	\N	\N	11:00:00	13:00:00	11:00 AM - 1:00 PM
32	SC2025120300000032	24	3	Attraction	2	\N	\N	\N	\N	\N	2	2025-12-03	08:19:07.480882	1000.00	0.00	Completed	Online	R25cac27f-9e86-4b4b-82fe-ec4df19e18e5	Booked	/uploads/tickets/2025/12/03/ORDER_ORD202512037c41be.pdf	f	f	2025-12-03 08:19:07.480882+00	2025-12-03 08:20:01.055328+00	\N	2025-12-03 08:19:07.480882+00	\N	\N	\N	\N	19:00:00	20:00:00	7:00 PM - 8:00 PM
\.


--
-- TOC entry 4103 (class 0 OID 19122)
-- Dependencies: 265
-- Data for Name: cart_bookings; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.cart_bookings (id, cart_id, booking_id, created_at) FROM stdin;
\.


--
-- TOC entry 4101 (class 0 OID 19077)
-- Dependencies: 263
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.cart_items (cart_item_id, cart_id, item_type, attraction_id, combo_id, offer_id, slot_id, booking_date, booking_time, quantity, unit_price, meta, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4099 (class 0 OID 19041)
-- Dependencies: 261
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.carts (cart_id, cart_ref, user_id, session_id, total_amount, discount_amount, payment_status, payment_mode, payment_ref, payment_txn_no, status, created_at, updated_at, coupon_code, abandoned_at) FROM stdin;
\.


--
-- TOC entry 4085 (class 0 OID 18793)
-- Dependencies: 247
-- Data for Name: cms_pages; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.cms_pages (page_id, title, slug, content, meta_title, meta_description, meta_keywords, editor_mode, raw_html, raw_css, raw_js, nav_group, nav_order, placement, placement_ref_id, gallery, active, created_at, updated_at, section_type, section_ref_id) FROM stdin;
\.


--
-- TOC entry 4075 (class 0 OID 18666)
-- Dependencies: 237
-- Data for Name: combo_attractions; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.combo_attractions (combo_attraction_id, combo_id, attraction_id, attraction_price, position_in_combo, created_at) FROM stdin;
9	2	1	500.00	1	2025-11-29 06:30:40.542077+00
10	2	2	300.00	2	2025-11-29 06:30:40.542077+00
11	3	1	500.00	1	2025-11-29 06:31:57.664064+00
12	3	2	300.00	2	2025-11-29 06:31:57.664064+00
23	4	1	500.00	1	2025-12-03 06:38:02.94619+00
24	4	2	400.00	2	2025-12-03 06:38:02.94619+00
25	4	3	300.00	3	2025-12-03 06:38:02.94619+00
26	1	1	425.00	1	2025-12-03 06:38:19.99401+00
27	1	2	425.00	2	2025-12-03 06:38:19.99401+00
\.


--
-- TOC entry 4077 (class 0 OID 18695)
-- Dependencies: 239
-- Data for Name: combo_slots; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.combo_slots (combo_slot_id, combo_id, combo_slot_code, start_date, end_date, start_time, end_time, capacity, price, available, created_at, updated_at) FROM stdin;
956	4	4-2025-11-29-1000	2025-11-29	2025-11-29	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
957	4	4-2025-11-29-1100	2025-11-29	2025-11-29	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
958	4	4-2025-11-29-1200	2025-11-29	2025-11-29	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
959	4	4-2025-11-29-1300	2025-11-29	2025-11-29	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
960	4	4-2025-11-29-1400	2025-11-29	2025-11-29	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
961	4	4-2025-11-29-1500	2025-11-29	2025-11-29	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
962	4	4-2025-11-29-1600	2025-11-29	2025-11-29	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
963	4	4-2025-11-29-1700	2025-11-29	2025-11-29	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
964	4	4-2025-11-30-1000	2025-11-30	2025-11-30	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
965	4	4-2025-11-30-1100	2025-11-30	2025-11-30	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
966	4	4-2025-11-30-1200	2025-11-30	2025-11-30	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
967	4	4-2025-11-30-1300	2025-11-30	2025-11-30	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
968	4	4-2025-11-30-1400	2025-11-30	2025-11-30	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
969	4	4-2025-11-30-1500	2025-11-30	2025-11-30	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
970	4	4-2025-11-30-1600	2025-11-30	2025-11-30	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
971	4	4-2025-11-30-1700	2025-11-30	2025-11-30	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
972	4	4-2025-12-01-1000	2025-12-01	2025-12-01	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
973	4	4-2025-12-01-1100	2025-12-01	2025-12-01	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
974	4	4-2025-12-01-1200	2025-12-01	2025-12-01	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
975	4	4-2025-12-01-1300	2025-12-01	2025-12-01	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
976	4	4-2025-12-01-1400	2025-12-01	2025-12-01	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
977	4	4-2025-12-01-1500	2025-12-01	2025-12-01	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
978	4	4-2025-12-01-1600	2025-12-01	2025-12-01	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
979	4	4-2025-12-01-1700	2025-12-01	2025-12-01	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
980	4	4-2025-12-02-1000	2025-12-02	2025-12-02	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
981	4	4-2025-12-02-1100	2025-12-02	2025-12-02	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
982	4	4-2025-12-02-1200	2025-12-02	2025-12-02	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
983	4	4-2025-12-02-1300	2025-12-02	2025-12-02	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
984	4	4-2025-12-02-1400	2025-12-02	2025-12-02	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
985	4	4-2025-12-02-1500	2025-12-02	2025-12-02	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
986	4	4-2025-12-02-1600	2025-12-02	2025-12-02	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
987	4	4-2025-12-02-1700	2025-12-02	2025-12-02	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
988	4	4-2025-12-03-1000	2025-12-03	2025-12-03	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
989	4	4-2025-12-03-1100	2025-12-03	2025-12-03	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
990	4	4-2025-12-03-1200	2025-12-03	2025-12-03	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
991	4	4-2025-12-03-1300	2025-12-03	2025-12-03	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
992	4	4-2025-12-03-1400	2025-12-03	2025-12-03	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
993	4	4-2025-12-03-1500	2025-12-03	2025-12-03	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
994	4	4-2025-12-03-1600	2025-12-03	2025-12-03	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
995	4	4-2025-12-03-1700	2025-12-03	2025-12-03	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
996	4	4-2025-12-04-1000	2025-12-04	2025-12-04	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
997	4	4-2025-12-04-1100	2025-12-04	2025-12-04	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
998	4	4-2025-12-04-1200	2025-12-04	2025-12-04	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
999	4	4-2025-12-04-1300	2025-12-04	2025-12-04	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1000	4	4-2025-12-04-1400	2025-12-04	2025-12-04	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1001	4	4-2025-12-04-1500	2025-12-04	2025-12-04	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1002	4	4-2025-12-04-1600	2025-12-04	2025-12-04	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1003	4	4-2025-12-04-1700	2025-12-04	2025-12-04	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1004	4	4-2025-12-05-1000	2025-12-05	2025-12-05	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1005	4	4-2025-12-05-1100	2025-12-05	2025-12-05	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1006	4	4-2025-12-05-1200	2025-12-05	2025-12-05	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1007	4	4-2025-12-05-1300	2025-12-05	2025-12-05	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1008	4	4-2025-12-05-1400	2025-12-05	2025-12-05	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1009	4	4-2025-12-05-1500	2025-12-05	2025-12-05	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1010	4	4-2025-12-05-1600	2025-12-05	2025-12-05	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1011	4	4-2025-12-05-1700	2025-12-05	2025-12-05	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1012	4	4-2025-12-06-1000	2025-12-06	2025-12-06	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1013	4	4-2025-12-06-1100	2025-12-06	2025-12-06	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1014	4	4-2025-12-06-1200	2025-12-06	2025-12-06	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1015	4	4-2025-12-06-1300	2025-12-06	2025-12-06	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1016	4	4-2025-12-06-1400	2025-12-06	2025-12-06	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1017	4	4-2025-12-06-1500	2025-12-06	2025-12-06	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1018	4	4-2025-12-06-1600	2025-12-06	2025-12-06	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1019	4	4-2025-12-06-1700	2025-12-06	2025-12-06	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1020	4	4-2025-12-07-1000	2025-12-07	2025-12-07	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1021	4	4-2025-12-07-1100	2025-12-07	2025-12-07	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1022	4	4-2025-12-07-1200	2025-12-07	2025-12-07	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1023	4	4-2025-12-07-1300	2025-12-07	2025-12-07	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1024	4	4-2025-12-07-1400	2025-12-07	2025-12-07	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1025	4	4-2025-12-07-1500	2025-12-07	2025-12-07	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1026	4	4-2025-12-07-1600	2025-12-07	2025-12-07	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1027	4	4-2025-12-07-1700	2025-12-07	2025-12-07	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1028	4	4-2025-12-08-1000	2025-12-08	2025-12-08	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1029	4	4-2025-12-08-1100	2025-12-08	2025-12-08	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1030	4	4-2025-12-08-1200	2025-12-08	2025-12-08	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1031	4	4-2025-12-08-1300	2025-12-08	2025-12-08	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1032	4	4-2025-12-08-1400	2025-12-08	2025-12-08	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1033	4	4-2025-12-08-1500	2025-12-08	2025-12-08	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1034	4	4-2025-12-08-1600	2025-12-08	2025-12-08	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1035	4	4-2025-12-08-1700	2025-12-08	2025-12-08	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1036	4	4-2025-12-09-1000	2025-12-09	2025-12-09	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1037	4	4-2025-12-09-1100	2025-12-09	2025-12-09	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1038	4	4-2025-12-09-1200	2025-12-09	2025-12-09	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1039	4	4-2025-12-09-1300	2025-12-09	2025-12-09	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1040	4	4-2025-12-09-1400	2025-12-09	2025-12-09	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1041	4	4-2025-12-09-1500	2025-12-09	2025-12-09	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1042	4	4-2025-12-09-1600	2025-12-09	2025-12-09	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1043	4	4-2025-12-09-1700	2025-12-09	2025-12-09	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1044	4	4-2025-12-10-1000	2025-12-10	2025-12-10	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1045	4	4-2025-12-10-1100	2025-12-10	2025-12-10	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1046	4	4-2025-12-10-1200	2025-12-10	2025-12-10	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1047	4	4-2025-12-10-1300	2025-12-10	2025-12-10	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1048	4	4-2025-12-10-1400	2025-12-10	2025-12-10	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1049	4	4-2025-12-10-1500	2025-12-10	2025-12-10	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1050	4	4-2025-12-10-1600	2025-12-10	2025-12-10	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1051	4	4-2025-12-10-1700	2025-12-10	2025-12-10	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1052	4	4-2025-12-11-1000	2025-12-11	2025-12-11	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1053	4	4-2025-12-11-1100	2025-12-11	2025-12-11	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1054	4	4-2025-12-11-1200	2025-12-11	2025-12-11	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1055	4	4-2025-12-11-1300	2025-12-11	2025-12-11	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1056	4	4-2025-12-11-1400	2025-12-11	2025-12-11	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1057	4	4-2025-12-11-1500	2025-12-11	2025-12-11	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1058	4	4-2025-12-11-1600	2025-12-11	2025-12-11	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1059	4	4-2025-12-11-1700	2025-12-11	2025-12-11	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1060	4	4-2025-12-12-1000	2025-12-12	2025-12-12	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1061	4	4-2025-12-12-1100	2025-12-12	2025-12-12	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1062	4	4-2025-12-12-1200	2025-12-12	2025-12-12	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1063	4	4-2025-12-12-1300	2025-12-12	2025-12-12	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1064	4	4-2025-12-12-1400	2025-12-12	2025-12-12	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1065	4	4-2025-12-12-1500	2025-12-12	2025-12-12	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1066	4	4-2025-12-12-1600	2025-12-12	2025-12-12	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1067	4	4-2025-12-12-1700	2025-12-12	2025-12-12	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1068	4	4-2025-12-13-1000	2025-12-13	2025-12-13	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1069	4	4-2025-12-13-1100	2025-12-13	2025-12-13	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1070	4	4-2025-12-13-1200	2025-12-13	2025-12-13	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1071	4	4-2025-12-13-1300	2025-12-13	2025-12-13	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1072	4	4-2025-12-13-1400	2025-12-13	2025-12-13	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1073	4	4-2025-12-13-1500	2025-12-13	2025-12-13	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1074	4	4-2025-12-13-1600	2025-12-13	2025-12-13	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1075	4	4-2025-12-13-1700	2025-12-13	2025-12-13	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1076	4	4-2025-12-14-1000	2025-12-14	2025-12-14	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1077	4	4-2025-12-14-1100	2025-12-14	2025-12-14	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1078	4	4-2025-12-14-1200	2025-12-14	2025-12-14	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1079	4	4-2025-12-14-1300	2025-12-14	2025-12-14	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1080	4	4-2025-12-14-1400	2025-12-14	2025-12-14	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1081	4	4-2025-12-14-1500	2025-12-14	2025-12-14	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1082	4	4-2025-12-14-1600	2025-12-14	2025-12-14	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1083	4	4-2025-12-14-1700	2025-12-14	2025-12-14	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1084	4	4-2025-12-15-1000	2025-12-15	2025-12-15	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1085	4	4-2025-12-15-1100	2025-12-15	2025-12-15	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1086	4	4-2025-12-15-1200	2025-12-15	2025-12-15	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1087	4	4-2025-12-15-1300	2025-12-15	2025-12-15	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1088	4	4-2025-12-15-1400	2025-12-15	2025-12-15	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1089	4	4-2025-12-15-1500	2025-12-15	2025-12-15	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1090	4	4-2025-12-15-1600	2025-12-15	2025-12-15	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1091	4	4-2025-12-15-1700	2025-12-15	2025-12-15	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1092	4	4-2025-12-16-1000	2025-12-16	2025-12-16	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1093	4	4-2025-12-16-1100	2025-12-16	2025-12-16	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1094	4	4-2025-12-16-1200	2025-12-16	2025-12-16	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1095	4	4-2025-12-16-1300	2025-12-16	2025-12-16	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1096	4	4-2025-12-16-1400	2025-12-16	2025-12-16	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1097	4	4-2025-12-16-1500	2025-12-16	2025-12-16	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1098	4	4-2025-12-16-1600	2025-12-16	2025-12-16	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1099	4	4-2025-12-16-1700	2025-12-16	2025-12-16	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1100	4	4-2025-12-17-1000	2025-12-17	2025-12-17	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1101	4	4-2025-12-17-1100	2025-12-17	2025-12-17	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1102	4	4-2025-12-17-1200	2025-12-17	2025-12-17	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1103	4	4-2025-12-17-1300	2025-12-17	2025-12-17	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1104	4	4-2025-12-17-1400	2025-12-17	2025-12-17	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1105	4	4-2025-12-17-1500	2025-12-17	2025-12-17	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1106	4	4-2025-12-17-1600	2025-12-17	2025-12-17	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1107	4	4-2025-12-17-1700	2025-12-17	2025-12-17	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1108	4	4-2025-12-18-1000	2025-12-18	2025-12-18	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1109	4	4-2025-12-18-1100	2025-12-18	2025-12-18	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1110	4	4-2025-12-18-1200	2025-12-18	2025-12-18	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1111	4	4-2025-12-18-1300	2025-12-18	2025-12-18	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1112	4	4-2025-12-18-1400	2025-12-18	2025-12-18	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1113	4	4-2025-12-18-1500	2025-12-18	2025-12-18	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1114	4	4-2025-12-18-1600	2025-12-18	2025-12-18	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1115	4	4-2025-12-18-1700	2025-12-18	2025-12-18	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1116	4	4-2025-12-19-1000	2025-12-19	2025-12-19	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1117	4	4-2025-12-19-1100	2025-12-19	2025-12-19	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1118	4	4-2025-12-19-1200	2025-12-19	2025-12-19	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1119	4	4-2025-12-19-1300	2025-12-19	2025-12-19	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1120	4	4-2025-12-19-1400	2025-12-19	2025-12-19	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1121	4	4-2025-12-19-1500	2025-12-19	2025-12-19	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1122	4	4-2025-12-19-1600	2025-12-19	2025-12-19	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1123	4	4-2025-12-19-1700	2025-12-19	2025-12-19	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1124	4	4-2025-12-20-1000	2025-12-20	2025-12-20	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1125	4	4-2025-12-20-1100	2025-12-20	2025-12-20	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1126	4	4-2025-12-20-1200	2025-12-20	2025-12-20	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1127	4	4-2025-12-20-1300	2025-12-20	2025-12-20	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1128	4	4-2025-12-20-1400	2025-12-20	2025-12-20	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1129	4	4-2025-12-20-1500	2025-12-20	2025-12-20	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1130	4	4-2025-12-20-1600	2025-12-20	2025-12-20	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1131	4	4-2025-12-20-1700	2025-12-20	2025-12-20	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1132	4	4-2025-12-21-1000	2025-12-21	2025-12-21	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1133	4	4-2025-12-21-1100	2025-12-21	2025-12-21	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1134	4	4-2025-12-21-1200	2025-12-21	2025-12-21	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1135	4	4-2025-12-21-1300	2025-12-21	2025-12-21	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1136	4	4-2025-12-21-1400	2025-12-21	2025-12-21	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1137	4	4-2025-12-21-1500	2025-12-21	2025-12-21	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1138	4	4-2025-12-21-1600	2025-12-21	2025-12-21	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1139	4	4-2025-12-21-1700	2025-12-21	2025-12-21	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1140	4	4-2025-12-22-1000	2025-12-22	2025-12-22	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1141	4	4-2025-12-22-1100	2025-12-22	2025-12-22	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1142	4	4-2025-12-22-1200	2025-12-22	2025-12-22	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1143	4	4-2025-12-22-1300	2025-12-22	2025-12-22	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1144	4	4-2025-12-22-1400	2025-12-22	2025-12-22	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1145	4	4-2025-12-22-1500	2025-12-22	2025-12-22	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1146	4	4-2025-12-22-1600	2025-12-22	2025-12-22	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1147	4	4-2025-12-22-1700	2025-12-22	2025-12-22	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1148	4	4-2025-12-23-1000	2025-12-23	2025-12-23	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1149	4	4-2025-12-23-1100	2025-12-23	2025-12-23	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1150	4	4-2025-12-23-1200	2025-12-23	2025-12-23	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1151	4	4-2025-12-23-1300	2025-12-23	2025-12-23	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1152	4	4-2025-12-23-1400	2025-12-23	2025-12-23	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1153	4	4-2025-12-23-1500	2025-12-23	2025-12-23	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1154	4	4-2025-12-23-1600	2025-12-23	2025-12-23	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1155	4	4-2025-12-23-1700	2025-12-23	2025-12-23	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1156	4	4-2025-12-24-1000	2025-12-24	2025-12-24	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1157	4	4-2025-12-24-1100	2025-12-24	2025-12-24	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1158	4	4-2025-12-24-1200	2025-12-24	2025-12-24	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1159	4	4-2025-12-24-1300	2025-12-24	2025-12-24	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1160	4	4-2025-12-24-1400	2025-12-24	2025-12-24	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1161	4	4-2025-12-24-1500	2025-12-24	2025-12-24	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1162	4	4-2025-12-24-1600	2025-12-24	2025-12-24	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1163	4	4-2025-12-24-1700	2025-12-24	2025-12-24	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1164	4	4-2025-12-25-1000	2025-12-25	2025-12-25	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1165	4	4-2025-12-25-1100	2025-12-25	2025-12-25	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1166	4	4-2025-12-25-1200	2025-12-25	2025-12-25	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1167	4	4-2025-12-25-1300	2025-12-25	2025-12-25	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1168	4	4-2025-12-25-1400	2025-12-25	2025-12-25	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1169	4	4-2025-12-25-1500	2025-12-25	2025-12-25	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1170	4	4-2025-12-25-1600	2025-12-25	2025-12-25	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1171	4	4-2025-12-25-1700	2025-12-25	2025-12-25	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1172	4	4-2025-12-26-1000	2025-12-26	2025-12-26	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1173	4	4-2025-12-26-1100	2025-12-26	2025-12-26	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1174	4	4-2025-12-26-1200	2025-12-26	2025-12-26	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1175	4	4-2025-12-26-1300	2025-12-26	2025-12-26	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1176	4	4-2025-12-26-1400	2025-12-26	2025-12-26	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1177	4	4-2025-12-26-1500	2025-12-26	2025-12-26	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1178	4	4-2025-12-26-1600	2025-12-26	2025-12-26	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1179	4	4-2025-12-26-1700	2025-12-26	2025-12-26	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1180	4	4-2025-12-27-1000	2025-12-27	2025-12-27	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1181	4	4-2025-12-27-1100	2025-12-27	2025-12-27	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1182	4	4-2025-12-27-1200	2025-12-27	2025-12-27	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1183	4	4-2025-12-27-1300	2025-12-27	2025-12-27	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1184	4	4-2025-12-27-1400	2025-12-27	2025-12-27	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1185	4	4-2025-12-27-1500	2025-12-27	2025-12-27	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1186	4	4-2025-12-27-1600	2025-12-27	2025-12-27	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1187	4	4-2025-12-27-1700	2025-12-27	2025-12-27	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1188	4	4-2025-12-28-1000	2025-12-28	2025-12-28	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1189	4	4-2025-12-28-1100	2025-12-28	2025-12-28	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1190	4	4-2025-12-28-1200	2025-12-28	2025-12-28	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1191	4	4-2025-12-28-1300	2025-12-28	2025-12-28	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1192	4	4-2025-12-28-1400	2025-12-28	2025-12-28	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1193	4	4-2025-12-28-1500	2025-12-28	2025-12-28	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1194	4	4-2025-12-28-1600	2025-12-28	2025-12-28	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1195	4	4-2025-12-28-1700	2025-12-28	2025-12-28	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1196	4	4-2025-12-29-1000	2025-12-29	2025-12-29	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1197	4	4-2025-12-29-1100	2025-12-29	2025-12-29	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1198	4	4-2025-12-29-1200	2025-12-29	2025-12-29	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1199	4	4-2025-12-29-1300	2025-12-29	2025-12-29	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1200	4	4-2025-12-29-1400	2025-12-29	2025-12-29	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1201	4	4-2025-12-29-1500	2025-12-29	2025-12-29	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1202	4	4-2025-12-29-1600	2025-12-29	2025-12-29	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1203	4	4-2025-12-29-1700	2025-12-29	2025-12-29	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1204	4	4-2025-12-30-1000	2025-12-30	2025-12-30	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1205	4	4-2025-12-30-1100	2025-12-30	2025-12-30	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1206	4	4-2025-12-30-1200	2025-12-30	2025-12-30	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1207	4	4-2025-12-30-1300	2025-12-30	2025-12-30	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1208	4	4-2025-12-30-1400	2025-12-30	2025-12-30	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1209	4	4-2025-12-30-1500	2025-12-30	2025-12-30	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1210	4	4-2025-12-30-1600	2025-12-30	2025-12-30	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1211	4	4-2025-12-30-1700	2025-12-30	2025-12-30	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1212	4	4-2025-12-31-1000	2025-12-31	2025-12-31	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1213	4	4-2025-12-31-1100	2025-12-31	2025-12-31	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1214	4	4-2025-12-31-1200	2025-12-31	2025-12-31	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1215	4	4-2025-12-31-1300	2025-12-31	2025-12-31	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1216	4	4-2025-12-31-1400	2025-12-31	2025-12-31	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1217	4	4-2025-12-31-1500	2025-12-31	2025-12-31	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1218	4	4-2025-12-31-1600	2025-12-31	2025-12-31	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1219	4	4-2025-12-31-1700	2025-12-31	2025-12-31	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1220	4	4-2026-01-01-1000	2026-01-01	2026-01-01	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1221	4	4-2026-01-01-1100	2026-01-01	2026-01-01	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1222	4	4-2026-01-01-1200	2026-01-01	2026-01-01	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1223	4	4-2026-01-01-1300	2026-01-01	2026-01-01	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1224	4	4-2026-01-01-1400	2026-01-01	2026-01-01	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1225	4	4-2026-01-01-1500	2026-01-01	2026-01-01	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1226	4	4-2026-01-01-1600	2026-01-01	2026-01-01	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1227	4	4-2026-01-01-1700	2026-01-01	2026-01-01	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1228	4	4-2026-01-02-1000	2026-01-02	2026-01-02	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1229	4	4-2026-01-02-1100	2026-01-02	2026-01-02	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1230	4	4-2026-01-02-1200	2026-01-02	2026-01-02	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1231	4	4-2026-01-02-1300	2026-01-02	2026-01-02	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1232	4	4-2026-01-02-1400	2026-01-02	2026-01-02	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1233	4	4-2026-01-02-1500	2026-01-02	2026-01-02	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1234	4	4-2026-01-02-1600	2026-01-02	2026-01-02	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1235	4	4-2026-01-02-1700	2026-01-02	2026-01-02	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1236	4	4-2026-01-03-1000	2026-01-03	2026-01-03	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1237	4	4-2026-01-03-1100	2026-01-03	2026-01-03	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1238	4	4-2026-01-03-1200	2026-01-03	2026-01-03	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1239	4	4-2026-01-03-1300	2026-01-03	2026-01-03	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1240	4	4-2026-01-03-1400	2026-01-03	2026-01-03	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1241	4	4-2026-01-03-1500	2026-01-03	2026-01-03	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1242	4	4-2026-01-03-1600	2026-01-03	2026-01-03	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1243	4	4-2026-01-03-1700	2026-01-03	2026-01-03	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1244	4	4-2026-01-04-1000	2026-01-04	2026-01-04	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1245	4	4-2026-01-04-1100	2026-01-04	2026-01-04	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1246	4	4-2026-01-04-1200	2026-01-04	2026-01-04	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1247	4	4-2026-01-04-1300	2026-01-04	2026-01-04	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1248	4	4-2026-01-04-1400	2026-01-04	2026-01-04	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1249	4	4-2026-01-04-1500	2026-01-04	2026-01-04	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1250	4	4-2026-01-04-1600	2026-01-04	2026-01-04	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1251	4	4-2026-01-04-1700	2026-01-04	2026-01-04	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1252	4	4-2026-01-05-1000	2026-01-05	2026-01-05	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1253	4	4-2026-01-05-1100	2026-01-05	2026-01-05	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1254	4	4-2026-01-05-1200	2026-01-05	2026-01-05	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1255	4	4-2026-01-05-1300	2026-01-05	2026-01-05	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1256	4	4-2026-01-05-1400	2026-01-05	2026-01-05	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1257	4	4-2026-01-05-1500	2026-01-05	2026-01-05	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1258	4	4-2026-01-05-1600	2026-01-05	2026-01-05	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1259	4	4-2026-01-05-1700	2026-01-05	2026-01-05	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1260	4	4-2026-01-06-1000	2026-01-06	2026-01-06	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1261	4	4-2026-01-06-1100	2026-01-06	2026-01-06	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1262	4	4-2026-01-06-1200	2026-01-06	2026-01-06	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1263	4	4-2026-01-06-1300	2026-01-06	2026-01-06	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1264	4	4-2026-01-06-1400	2026-01-06	2026-01-06	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1265	4	4-2026-01-06-1500	2026-01-06	2026-01-06	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1266	4	4-2026-01-06-1600	2026-01-06	2026-01-06	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1267	4	4-2026-01-06-1700	2026-01-06	2026-01-06	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1268	4	4-2026-01-07-1000	2026-01-07	2026-01-07	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1269	4	4-2026-01-07-1100	2026-01-07	2026-01-07	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1270	4	4-2026-01-07-1200	2026-01-07	2026-01-07	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1271	4	4-2026-01-07-1300	2026-01-07	2026-01-07	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1272	4	4-2026-01-07-1400	2026-01-07	2026-01-07	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1273	4	4-2026-01-07-1500	2026-01-07	2026-01-07	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1274	4	4-2026-01-07-1600	2026-01-07	2026-01-07	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1275	4	4-2026-01-07-1700	2026-01-07	2026-01-07	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1276	4	4-2026-01-08-1000	2026-01-08	2026-01-08	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1277	4	4-2026-01-08-1100	2026-01-08	2026-01-08	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1278	4	4-2026-01-08-1200	2026-01-08	2026-01-08	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1279	4	4-2026-01-08-1300	2026-01-08	2026-01-08	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1280	4	4-2026-01-08-1400	2026-01-08	2026-01-08	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1281	4	4-2026-01-08-1500	2026-01-08	2026-01-08	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1282	4	4-2026-01-08-1600	2026-01-08	2026-01-08	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1283	4	4-2026-01-08-1700	2026-01-08	2026-01-08	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1284	4	4-2026-01-09-1000	2026-01-09	2026-01-09	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1285	4	4-2026-01-09-1100	2026-01-09	2026-01-09	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1286	4	4-2026-01-09-1200	2026-01-09	2026-01-09	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1287	4	4-2026-01-09-1300	2026-01-09	2026-01-09	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1288	4	4-2026-01-09-1400	2026-01-09	2026-01-09	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1289	4	4-2026-01-09-1500	2026-01-09	2026-01-09	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1290	4	4-2026-01-09-1600	2026-01-09	2026-01-09	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1291	4	4-2026-01-09-1700	2026-01-09	2026-01-09	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1292	4	4-2026-01-10-1000	2026-01-10	2026-01-10	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1293	4	4-2026-01-10-1100	2026-01-10	2026-01-10	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1294	4	4-2026-01-10-1200	2026-01-10	2026-01-10	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1295	4	4-2026-01-10-1300	2026-01-10	2026-01-10	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1296	4	4-2026-01-10-1400	2026-01-10	2026-01-10	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1297	4	4-2026-01-10-1500	2026-01-10	2026-01-10	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1298	4	4-2026-01-10-1600	2026-01-10	2026-01-10	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1299	4	4-2026-01-10-1700	2026-01-10	2026-01-10	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1300	4	4-2026-01-11-1000	2026-01-11	2026-01-11	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1301	4	4-2026-01-11-1100	2026-01-11	2026-01-11	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1302	4	4-2026-01-11-1200	2026-01-11	2026-01-11	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1303	4	4-2026-01-11-1300	2026-01-11	2026-01-11	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1304	4	4-2026-01-11-1400	2026-01-11	2026-01-11	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1305	4	4-2026-01-11-1500	2026-01-11	2026-01-11	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1306	4	4-2026-01-11-1600	2026-01-11	2026-01-11	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1307	4	4-2026-01-11-1700	2026-01-11	2026-01-11	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1308	4	4-2026-01-12-1000	2026-01-12	2026-01-12	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1309	4	4-2026-01-12-1100	2026-01-12	2026-01-12	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1310	4	4-2026-01-12-1200	2026-01-12	2026-01-12	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1311	4	4-2026-01-12-1300	2026-01-12	2026-01-12	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1312	4	4-2026-01-12-1400	2026-01-12	2026-01-12	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1313	4	4-2026-01-12-1500	2026-01-12	2026-01-12	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1314	4	4-2026-01-12-1600	2026-01-12	2026-01-12	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1315	4	4-2026-01-12-1700	2026-01-12	2026-01-12	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1316	4	4-2026-01-13-1000	2026-01-13	2026-01-13	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1317	4	4-2026-01-13-1100	2026-01-13	2026-01-13	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1318	4	4-2026-01-13-1200	2026-01-13	2026-01-13	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1319	4	4-2026-01-13-1300	2026-01-13	2026-01-13	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1320	4	4-2026-01-13-1400	2026-01-13	2026-01-13	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1321	4	4-2026-01-13-1500	2026-01-13	2026-01-13	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1322	4	4-2026-01-13-1600	2026-01-13	2026-01-13	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1323	4	4-2026-01-13-1700	2026-01-13	2026-01-13	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1324	4	4-2026-01-14-1000	2026-01-14	2026-01-14	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1325	4	4-2026-01-14-1100	2026-01-14	2026-01-14	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1326	4	4-2026-01-14-1200	2026-01-14	2026-01-14	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1327	4	4-2026-01-14-1300	2026-01-14	2026-01-14	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1328	4	4-2026-01-14-1400	2026-01-14	2026-01-14	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1329	4	4-2026-01-14-1500	2026-01-14	2026-01-14	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1330	4	4-2026-01-14-1600	2026-01-14	2026-01-14	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1331	4	4-2026-01-14-1700	2026-01-14	2026-01-14	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1332	4	4-2026-01-15-1000	2026-01-15	2026-01-15	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1333	4	4-2026-01-15-1100	2026-01-15	2026-01-15	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1334	4	4-2026-01-15-1200	2026-01-15	2026-01-15	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1335	4	4-2026-01-15-1300	2026-01-15	2026-01-15	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1336	4	4-2026-01-15-1400	2026-01-15	2026-01-15	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1337	4	4-2026-01-15-1500	2026-01-15	2026-01-15	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1338	4	4-2026-01-15-1600	2026-01-15	2026-01-15	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1339	4	4-2026-01-15-1700	2026-01-15	2026-01-15	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1340	4	4-2026-01-16-1000	2026-01-16	2026-01-16	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1341	4	4-2026-01-16-1100	2026-01-16	2026-01-16	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1342	4	4-2026-01-16-1200	2026-01-16	2026-01-16	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1343	4	4-2026-01-16-1300	2026-01-16	2026-01-16	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1344	4	4-2026-01-16-1400	2026-01-16	2026-01-16	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1345	4	4-2026-01-16-1500	2026-01-16	2026-01-16	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1346	4	4-2026-01-16-1600	2026-01-16	2026-01-16	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1347	4	4-2026-01-16-1700	2026-01-16	2026-01-16	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1348	4	4-2026-01-17-1000	2026-01-17	2026-01-17	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1349	4	4-2026-01-17-1100	2026-01-17	2026-01-17	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1350	4	4-2026-01-17-1200	2026-01-17	2026-01-17	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1351	4	4-2026-01-17-1300	2026-01-17	2026-01-17	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1352	4	4-2026-01-17-1400	2026-01-17	2026-01-17	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1353	4	4-2026-01-17-1500	2026-01-17	2026-01-17	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1354	4	4-2026-01-17-1600	2026-01-17	2026-01-17	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1355	4	4-2026-01-17-1700	2026-01-17	2026-01-17	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1356	4	4-2026-01-18-1000	2026-01-18	2026-01-18	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1357	4	4-2026-01-18-1100	2026-01-18	2026-01-18	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1358	4	4-2026-01-18-1200	2026-01-18	2026-01-18	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1359	4	4-2026-01-18-1300	2026-01-18	2026-01-18	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1360	4	4-2026-01-18-1400	2026-01-18	2026-01-18	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1361	4	4-2026-01-18-1500	2026-01-18	2026-01-18	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1362	4	4-2026-01-18-1600	2026-01-18	2026-01-18	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1363	4	4-2026-01-18-1700	2026-01-18	2026-01-18	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1364	4	4-2026-01-19-1000	2026-01-19	2026-01-19	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1365	4	4-2026-01-19-1100	2026-01-19	2026-01-19	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1366	4	4-2026-01-19-1200	2026-01-19	2026-01-19	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1367	4	4-2026-01-19-1300	2026-01-19	2026-01-19	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1368	4	4-2026-01-19-1400	2026-01-19	2026-01-19	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1369	4	4-2026-01-19-1500	2026-01-19	2026-01-19	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1370	4	4-2026-01-19-1600	2026-01-19	2026-01-19	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1371	4	4-2026-01-19-1700	2026-01-19	2026-01-19	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1372	4	4-2026-01-20-1000	2026-01-20	2026-01-20	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1373	4	4-2026-01-20-1100	2026-01-20	2026-01-20	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1374	4	4-2026-01-20-1200	2026-01-20	2026-01-20	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1375	4	4-2026-01-20-1300	2026-01-20	2026-01-20	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1376	4	4-2026-01-20-1400	2026-01-20	2026-01-20	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1377	4	4-2026-01-20-1500	2026-01-20	2026-01-20	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1378	4	4-2026-01-20-1600	2026-01-20	2026-01-20	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1379	4	4-2026-01-20-1700	2026-01-20	2026-01-20	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1380	4	4-2026-01-21-1000	2026-01-21	2026-01-21	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1381	4	4-2026-01-21-1100	2026-01-21	2026-01-21	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1382	4	4-2026-01-21-1200	2026-01-21	2026-01-21	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1383	4	4-2026-01-21-1300	2026-01-21	2026-01-21	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1384	4	4-2026-01-21-1400	2026-01-21	2026-01-21	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1385	4	4-2026-01-21-1500	2026-01-21	2026-01-21	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1386	4	4-2026-01-21-1600	2026-01-21	2026-01-21	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1387	4	4-2026-01-21-1700	2026-01-21	2026-01-21	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1388	4	4-2026-01-22-1000	2026-01-22	2026-01-22	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1389	4	4-2026-01-22-1100	2026-01-22	2026-01-22	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1390	4	4-2026-01-22-1200	2026-01-22	2026-01-22	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1391	4	4-2026-01-22-1300	2026-01-22	2026-01-22	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1392	4	4-2026-01-22-1400	2026-01-22	2026-01-22	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1393	4	4-2026-01-22-1500	2026-01-22	2026-01-22	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1394	4	4-2026-01-22-1600	2026-01-22	2026-01-22	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1395	4	4-2026-01-22-1700	2026-01-22	2026-01-22	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1396	4	4-2026-01-23-1000	2026-01-23	2026-01-23	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1397	4	4-2026-01-23-1100	2026-01-23	2026-01-23	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1398	4	4-2026-01-23-1200	2026-01-23	2026-01-23	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1399	4	4-2026-01-23-1300	2026-01-23	2026-01-23	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1400	4	4-2026-01-23-1400	2026-01-23	2026-01-23	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1401	4	4-2026-01-23-1500	2026-01-23	2026-01-23	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1402	4	4-2026-01-23-1600	2026-01-23	2026-01-23	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1403	4	4-2026-01-23-1700	2026-01-23	2026-01-23	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1404	4	4-2026-01-24-1000	2026-01-24	2026-01-24	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1405	4	4-2026-01-24-1100	2026-01-24	2026-01-24	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1406	4	4-2026-01-24-1200	2026-01-24	2026-01-24	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1407	4	4-2026-01-24-1300	2026-01-24	2026-01-24	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1408	4	4-2026-01-24-1400	2026-01-24	2026-01-24	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1409	4	4-2026-01-24-1500	2026-01-24	2026-01-24	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1410	4	4-2026-01-24-1600	2026-01-24	2026-01-24	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1411	4	4-2026-01-24-1700	2026-01-24	2026-01-24	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1412	4	4-2026-01-25-1000	2026-01-25	2026-01-25	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1413	4	4-2026-01-25-1100	2026-01-25	2026-01-25	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1414	4	4-2026-01-25-1200	2026-01-25	2026-01-25	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1415	4	4-2026-01-25-1300	2026-01-25	2026-01-25	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1416	4	4-2026-01-25-1400	2026-01-25	2026-01-25	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1417	4	4-2026-01-25-1500	2026-01-25	2026-01-25	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1418	4	4-2026-01-25-1600	2026-01-25	2026-01-25	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1419	4	4-2026-01-25-1700	2026-01-25	2026-01-25	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1420	4	4-2026-01-26-1000	2026-01-26	2026-01-26	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1421	4	4-2026-01-26-1100	2026-01-26	2026-01-26	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1422	4	4-2026-01-26-1200	2026-01-26	2026-01-26	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1423	4	4-2026-01-26-1300	2026-01-26	2026-01-26	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1424	4	4-2026-01-26-1400	2026-01-26	2026-01-26	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1425	4	4-2026-01-26-1500	2026-01-26	2026-01-26	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1426	4	4-2026-01-26-1600	2026-01-26	2026-01-26	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1427	4	4-2026-01-26-1700	2026-01-26	2026-01-26	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1428	4	4-2026-01-27-1000	2026-01-27	2026-01-27	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1429	4	4-2026-01-27-1100	2026-01-27	2026-01-27	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1430	4	4-2026-01-27-1200	2026-01-27	2026-01-27	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1431	4	4-2026-01-27-1300	2026-01-27	2026-01-27	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1432	4	4-2026-01-27-1400	2026-01-27	2026-01-27	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1433	4	4-2026-01-27-1500	2026-01-27	2026-01-27	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1434	4	4-2026-01-27-1600	2026-01-27	2026-01-27	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1435	4	4-2026-01-27-1700	2026-01-27	2026-01-27	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1436	4	4-2026-01-28-1000	2026-01-28	2026-01-28	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1437	4	4-2026-01-28-1100	2026-01-28	2026-01-28	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1438	4	4-2026-01-28-1200	2026-01-28	2026-01-28	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1439	4	4-2026-01-28-1300	2026-01-28	2026-01-28	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1440	4	4-2026-01-28-1400	2026-01-28	2026-01-28	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1441	4	4-2026-01-28-1500	2026-01-28	2026-01-28	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1442	4	4-2026-01-28-1600	2026-01-28	2026-01-28	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1443	4	4-2026-01-28-1700	2026-01-28	2026-01-28	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1444	4	4-2026-01-29-1000	2026-01-29	2026-01-29	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1445	4	4-2026-01-29-1100	2026-01-29	2026-01-29	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1446	4	4-2026-01-29-1200	2026-01-29	2026-01-29	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1447	4	4-2026-01-29-1300	2026-01-29	2026-01-29	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1448	4	4-2026-01-29-1400	2026-01-29	2026-01-29	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1449	4	4-2026-01-29-1500	2026-01-29	2026-01-29	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1450	4	4-2026-01-29-1600	2026-01-29	2026-01-29	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1451	4	4-2026-01-29-1700	2026-01-29	2026-01-29	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1452	4	4-2026-01-30-1000	2026-01-30	2026-01-30	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1453	4	4-2026-01-30-1100	2026-01-30	2026-01-30	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1454	4	4-2026-01-30-1200	2026-01-30	2026-01-30	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1455	4	4-2026-01-30-1300	2026-01-30	2026-01-30	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1456	4	4-2026-01-30-1400	2026-01-30	2026-01-30	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1457	4	4-2026-01-30-1500	2026-01-30	2026-01-30	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1458	4	4-2026-01-30-1600	2026-01-30	2026-01-30	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1459	4	4-2026-01-30-1700	2026-01-30	2026-01-30	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1460	4	4-2026-01-31-1000	2026-01-31	2026-01-31	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1461	4	4-2026-01-31-1100	2026-01-31	2026-01-31	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1462	4	4-2026-01-31-1200	2026-01-31	2026-01-31	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1463	4	4-2026-01-31-1300	2026-01-31	2026-01-31	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1464	4	4-2026-01-31-1400	2026-01-31	2026-01-31	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1465	4	4-2026-01-31-1500	2026-01-31	2026-01-31	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1466	4	4-2026-01-31-1600	2026-01-31	2026-01-31	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1467	4	4-2026-01-31-1700	2026-01-31	2026-01-31	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1468	4	4-2026-02-01-1000	2026-02-01	2026-02-01	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1469	4	4-2026-02-01-1100	2026-02-01	2026-02-01	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1470	4	4-2026-02-01-1200	2026-02-01	2026-02-01	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1471	4	4-2026-02-01-1300	2026-02-01	2026-02-01	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1472	4	4-2026-02-01-1400	2026-02-01	2026-02-01	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1473	4	4-2026-02-01-1500	2026-02-01	2026-02-01	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1474	4	4-2026-02-01-1600	2026-02-01	2026-02-01	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1475	4	4-2026-02-01-1700	2026-02-01	2026-02-01	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1476	4	4-2026-02-02-1000	2026-02-02	2026-02-02	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1477	4	4-2026-02-02-1100	2026-02-02	2026-02-02	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1478	4	4-2026-02-02-1200	2026-02-02	2026-02-02	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1479	4	4-2026-02-02-1300	2026-02-02	2026-02-02	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1480	4	4-2026-02-02-1400	2026-02-02	2026-02-02	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1481	4	4-2026-02-02-1500	2026-02-02	2026-02-02	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1482	4	4-2026-02-02-1600	2026-02-02	2026-02-02	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1483	4	4-2026-02-02-1700	2026-02-02	2026-02-02	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1484	4	4-2026-02-03-1000	2026-02-03	2026-02-03	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1485	4	4-2026-02-03-1100	2026-02-03	2026-02-03	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1486	4	4-2026-02-03-1200	2026-02-03	2026-02-03	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1487	4	4-2026-02-03-1300	2026-02-03	2026-02-03	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1488	4	4-2026-02-03-1400	2026-02-03	2026-02-03	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1489	4	4-2026-02-03-1500	2026-02-03	2026-02-03	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1490	4	4-2026-02-03-1600	2026-02-03	2026-02-03	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1491	4	4-2026-02-03-1700	2026-02-03	2026-02-03	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1492	4	4-2026-02-04-1000	2026-02-04	2026-02-04	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1493	4	4-2026-02-04-1100	2026-02-04	2026-02-04	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1494	4	4-2026-02-04-1200	2026-02-04	2026-02-04	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1495	4	4-2026-02-04-1300	2026-02-04	2026-02-04	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1496	4	4-2026-02-04-1400	2026-02-04	2026-02-04	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1497	4	4-2026-02-04-1500	2026-02-04	2026-02-04	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1498	4	4-2026-02-04-1600	2026-02-04	2026-02-04	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1499	4	4-2026-02-04-1700	2026-02-04	2026-02-04	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1500	4	4-2026-02-05-1000	2026-02-05	2026-02-05	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1501	4	4-2026-02-05-1100	2026-02-05	2026-02-05	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1502	4	4-2026-02-05-1200	2026-02-05	2026-02-05	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1503	4	4-2026-02-05-1300	2026-02-05	2026-02-05	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1504	4	4-2026-02-05-1400	2026-02-05	2026-02-05	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1505	4	4-2026-02-05-1500	2026-02-05	2026-02-05	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1506	4	4-2026-02-05-1600	2026-02-05	2026-02-05	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1507	4	4-2026-02-05-1700	2026-02-05	2026-02-05	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1508	4	4-2026-02-06-1000	2026-02-06	2026-02-06	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1509	4	4-2026-02-06-1100	2026-02-06	2026-02-06	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1510	4	4-2026-02-06-1200	2026-02-06	2026-02-06	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1511	4	4-2026-02-06-1300	2026-02-06	2026-02-06	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1512	4	4-2026-02-06-1400	2026-02-06	2026-02-06	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1513	4	4-2026-02-06-1500	2026-02-06	2026-02-06	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1514	4	4-2026-02-06-1600	2026-02-06	2026-02-06	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1515	4	4-2026-02-06-1700	2026-02-06	2026-02-06	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1516	4	4-2026-02-07-1000	2026-02-07	2026-02-07	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1517	4	4-2026-02-07-1100	2026-02-07	2026-02-07	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1518	4	4-2026-02-07-1200	2026-02-07	2026-02-07	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1519	4	4-2026-02-07-1300	2026-02-07	2026-02-07	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1520	4	4-2026-02-07-1400	2026-02-07	2026-02-07	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1521	4	4-2026-02-07-1500	2026-02-07	2026-02-07	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1522	4	4-2026-02-07-1600	2026-02-07	2026-02-07	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1523	4	4-2026-02-07-1700	2026-02-07	2026-02-07	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1524	4	4-2026-02-08-1000	2026-02-08	2026-02-08	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1525	4	4-2026-02-08-1100	2026-02-08	2026-02-08	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1526	4	4-2026-02-08-1200	2026-02-08	2026-02-08	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1527	4	4-2026-02-08-1300	2026-02-08	2026-02-08	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1528	4	4-2026-02-08-1400	2026-02-08	2026-02-08	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1529	4	4-2026-02-08-1500	2026-02-08	2026-02-08	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1530	4	4-2026-02-08-1600	2026-02-08	2026-02-08	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1531	4	4-2026-02-08-1700	2026-02-08	2026-02-08	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1532	4	4-2026-02-09-1000	2026-02-09	2026-02-09	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1533	4	4-2026-02-09-1100	2026-02-09	2026-02-09	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1534	4	4-2026-02-09-1200	2026-02-09	2026-02-09	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1535	4	4-2026-02-09-1300	2026-02-09	2026-02-09	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1536	4	4-2026-02-09-1400	2026-02-09	2026-02-09	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1537	4	4-2026-02-09-1500	2026-02-09	2026-02-09	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1538	4	4-2026-02-09-1600	2026-02-09	2026-02-09	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1539	4	4-2026-02-09-1700	2026-02-09	2026-02-09	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1540	4	4-2026-02-10-1000	2026-02-10	2026-02-10	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1541	4	4-2026-02-10-1100	2026-02-10	2026-02-10	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1542	4	4-2026-02-10-1200	2026-02-10	2026-02-10	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1543	4	4-2026-02-10-1300	2026-02-10	2026-02-10	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1544	4	4-2026-02-10-1400	2026-02-10	2026-02-10	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1545	4	4-2026-02-10-1500	2026-02-10	2026-02-10	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1546	4	4-2026-02-10-1600	2026-02-10	2026-02-10	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1547	4	4-2026-02-10-1700	2026-02-10	2026-02-10	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1548	4	4-2026-02-11-1000	2026-02-11	2026-02-11	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1549	4	4-2026-02-11-1100	2026-02-11	2026-02-11	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1550	4	4-2026-02-11-1200	2026-02-11	2026-02-11	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1551	4	4-2026-02-11-1300	2026-02-11	2026-02-11	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1552	4	4-2026-02-11-1400	2026-02-11	2026-02-11	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1553	4	4-2026-02-11-1500	2026-02-11	2026-02-11	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1554	4	4-2026-02-11-1600	2026-02-11	2026-02-11	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1555	4	4-2026-02-11-1700	2026-02-11	2026-02-11	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1556	4	4-2026-02-12-1000	2026-02-12	2026-02-12	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1557	4	4-2026-02-12-1100	2026-02-12	2026-02-12	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1558	4	4-2026-02-12-1200	2026-02-12	2026-02-12	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1559	4	4-2026-02-12-1300	2026-02-12	2026-02-12	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1560	4	4-2026-02-12-1400	2026-02-12	2026-02-12	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1561	4	4-2026-02-12-1500	2026-02-12	2026-02-12	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1562	4	4-2026-02-12-1600	2026-02-12	2026-02-12	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1563	4	4-2026-02-12-1700	2026-02-12	2026-02-12	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1564	4	4-2026-02-13-1000	2026-02-13	2026-02-13	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1565	4	4-2026-02-13-1100	2026-02-13	2026-02-13	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1566	4	4-2026-02-13-1200	2026-02-13	2026-02-13	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1567	4	4-2026-02-13-1300	2026-02-13	2026-02-13	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1568	4	4-2026-02-13-1400	2026-02-13	2026-02-13	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1569	4	4-2026-02-13-1500	2026-02-13	2026-02-13	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1570	4	4-2026-02-13-1600	2026-02-13	2026-02-13	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1571	4	4-2026-02-13-1700	2026-02-13	2026-02-13	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1572	4	4-2026-02-14-1000	2026-02-14	2026-02-14	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1573	4	4-2026-02-14-1100	2026-02-14	2026-02-14	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1574	4	4-2026-02-14-1200	2026-02-14	2026-02-14	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1575	4	4-2026-02-14-1300	2026-02-14	2026-02-14	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1576	4	4-2026-02-14-1400	2026-02-14	2026-02-14	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1577	4	4-2026-02-14-1500	2026-02-14	2026-02-14	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1578	4	4-2026-02-14-1600	2026-02-14	2026-02-14	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1579	4	4-2026-02-14-1700	2026-02-14	2026-02-14	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1580	4	4-2026-02-15-1000	2026-02-15	2026-02-15	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1581	4	4-2026-02-15-1100	2026-02-15	2026-02-15	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1582	4	4-2026-02-15-1200	2026-02-15	2026-02-15	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1583	4	4-2026-02-15-1300	2026-02-15	2026-02-15	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1584	4	4-2026-02-15-1400	2026-02-15	2026-02-15	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1585	4	4-2026-02-15-1500	2026-02-15	2026-02-15	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1586	4	4-2026-02-15-1600	2026-02-15	2026-02-15	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1587	4	4-2026-02-15-1700	2026-02-15	2026-02-15	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1588	4	4-2026-02-16-1000	2026-02-16	2026-02-16	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1589	4	4-2026-02-16-1100	2026-02-16	2026-02-16	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1590	4	4-2026-02-16-1200	2026-02-16	2026-02-16	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1591	4	4-2026-02-16-1300	2026-02-16	2026-02-16	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1592	4	4-2026-02-16-1400	2026-02-16	2026-02-16	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1593	4	4-2026-02-16-1500	2026-02-16	2026-02-16	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1594	4	4-2026-02-16-1600	2026-02-16	2026-02-16	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1595	4	4-2026-02-16-1700	2026-02-16	2026-02-16	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1596	4	4-2026-02-17-1000	2026-02-17	2026-02-17	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1597	4	4-2026-02-17-1100	2026-02-17	2026-02-17	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1598	4	4-2026-02-17-1200	2026-02-17	2026-02-17	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1599	4	4-2026-02-17-1300	2026-02-17	2026-02-17	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1600	4	4-2026-02-17-1400	2026-02-17	2026-02-17	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1601	4	4-2026-02-17-1500	2026-02-17	2026-02-17	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1602	4	4-2026-02-17-1600	2026-02-17	2026-02-17	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1603	4	4-2026-02-17-1700	2026-02-17	2026-02-17	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1604	4	4-2026-02-18-1000	2026-02-18	2026-02-18	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1605	4	4-2026-02-18-1100	2026-02-18	2026-02-18	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1606	4	4-2026-02-18-1200	2026-02-18	2026-02-18	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1607	4	4-2026-02-18-1300	2026-02-18	2026-02-18	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1608	4	4-2026-02-18-1400	2026-02-18	2026-02-18	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1609	4	4-2026-02-18-1500	2026-02-18	2026-02-18	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1610	4	4-2026-02-18-1600	2026-02-18	2026-02-18	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1611	4	4-2026-02-18-1700	2026-02-18	2026-02-18	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1612	4	4-2026-02-19-1000	2026-02-19	2026-02-19	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1613	4	4-2026-02-19-1100	2026-02-19	2026-02-19	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1614	4	4-2026-02-19-1200	2026-02-19	2026-02-19	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1615	4	4-2026-02-19-1300	2026-02-19	2026-02-19	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1616	4	4-2026-02-19-1400	2026-02-19	2026-02-19	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1617	4	4-2026-02-19-1500	2026-02-19	2026-02-19	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1618	4	4-2026-02-19-1600	2026-02-19	2026-02-19	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1619	4	4-2026-02-19-1700	2026-02-19	2026-02-19	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1620	4	4-2026-02-20-1000	2026-02-20	2026-02-20	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1621	4	4-2026-02-20-1100	2026-02-20	2026-02-20	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1622	4	4-2026-02-20-1200	2026-02-20	2026-02-20	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1623	4	4-2026-02-20-1300	2026-02-20	2026-02-20	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1624	4	4-2026-02-20-1400	2026-02-20	2026-02-20	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1625	4	4-2026-02-20-1500	2026-02-20	2026-02-20	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1626	4	4-2026-02-20-1600	2026-02-20	2026-02-20	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1627	4	4-2026-02-20-1700	2026-02-20	2026-02-20	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1628	4	4-2026-02-21-1000	2026-02-21	2026-02-21	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1629	4	4-2026-02-21-1100	2026-02-21	2026-02-21	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1630	4	4-2026-02-21-1200	2026-02-21	2026-02-21	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1631	4	4-2026-02-21-1300	2026-02-21	2026-02-21	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1632	4	4-2026-02-21-1400	2026-02-21	2026-02-21	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1633	4	4-2026-02-21-1500	2026-02-21	2026-02-21	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1634	4	4-2026-02-21-1600	2026-02-21	2026-02-21	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1635	4	4-2026-02-21-1700	2026-02-21	2026-02-21	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1636	4	4-2026-02-22-1000	2026-02-22	2026-02-22	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1637	4	4-2026-02-22-1100	2026-02-22	2026-02-22	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1638	4	4-2026-02-22-1200	2026-02-22	2026-02-22	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1639	4	4-2026-02-22-1300	2026-02-22	2026-02-22	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1640	4	4-2026-02-22-1400	2026-02-22	2026-02-22	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1641	4	4-2026-02-22-1500	2026-02-22	2026-02-22	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1642	4	4-2026-02-22-1600	2026-02-22	2026-02-22	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1643	4	4-2026-02-22-1700	2026-02-22	2026-02-22	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1644	4	4-2026-02-23-1000	2026-02-23	2026-02-23	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1645	4	4-2026-02-23-1100	2026-02-23	2026-02-23	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1646	4	4-2026-02-23-1200	2026-02-23	2026-02-23	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1647	4	4-2026-02-23-1300	2026-02-23	2026-02-23	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1648	4	4-2026-02-23-1400	2026-02-23	2026-02-23	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1649	4	4-2026-02-23-1500	2026-02-23	2026-02-23	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1650	4	4-2026-02-23-1600	2026-02-23	2026-02-23	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1651	4	4-2026-02-23-1700	2026-02-23	2026-02-23	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1652	4	4-2026-02-24-1000	2026-02-24	2026-02-24	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1653	4	4-2026-02-24-1100	2026-02-24	2026-02-24	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1654	4	4-2026-02-24-1200	2026-02-24	2026-02-24	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1655	4	4-2026-02-24-1300	2026-02-24	2026-02-24	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1656	4	4-2026-02-24-1400	2026-02-24	2026-02-24	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1657	4	4-2026-02-24-1500	2026-02-24	2026-02-24	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1658	4	4-2026-02-24-1600	2026-02-24	2026-02-24	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1659	4	4-2026-02-24-1700	2026-02-24	2026-02-24	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1660	4	4-2026-02-25-1000	2026-02-25	2026-02-25	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1661	4	4-2026-02-25-1100	2026-02-25	2026-02-25	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1662	4	4-2026-02-25-1200	2026-02-25	2026-02-25	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1663	4	4-2026-02-25-1300	2026-02-25	2026-02-25	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1664	4	4-2026-02-25-1400	2026-02-25	2026-02-25	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1665	4	4-2026-02-25-1500	2026-02-25	2026-02-25	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1666	4	4-2026-02-25-1600	2026-02-25	2026-02-25	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1667	4	4-2026-02-25-1700	2026-02-25	2026-02-25	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1668	4	4-2026-02-26-1000	2026-02-26	2026-02-26	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1669	4	4-2026-02-26-1100	2026-02-26	2026-02-26	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1670	4	4-2026-02-26-1200	2026-02-26	2026-02-26	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1671	4	4-2026-02-26-1300	2026-02-26	2026-02-26	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1672	4	4-2026-02-26-1400	2026-02-26	2026-02-26	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1673	4	4-2026-02-26-1500	2026-02-26	2026-02-26	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1674	4	4-2026-02-26-1600	2026-02-26	2026-02-26	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1675	4	4-2026-02-26-1700	2026-02-26	2026-02-26	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1676	4	4-2026-02-27-1000	2026-02-27	2026-02-27	10:00:00	13:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1677	4	4-2026-02-27-1100	2026-02-27	2026-02-27	11:00:00	14:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1678	4	4-2026-02-27-1200	2026-02-27	2026-02-27	12:00:00	15:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1679	4	4-2026-02-27-1300	2026-02-27	2026-02-27	13:00:00	16:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1680	4	4-2026-02-27-1400	2026-02-27	2026-02-27	14:00:00	17:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1681	4	4-2026-02-27-1500	2026-02-27	2026-02-27	15:00:00	18:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1682	4	4-2026-02-27-1600	2026-02-27	2026-02-27	16:00:00	19:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
1683	4	4-2026-02-27-1700	2026-02-27	2026-02-27	17:00:00	20:00:00	300	0.00	t	2025-11-29 12:29:25.058897+00	2025-11-29 12:29:25.058897+00
\.


--
-- TOC entry 4125 (class 0 OID 19407)
-- Dependencies: 287
-- Data for Name: combos; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.combos (combo_id, attraction_1_id, attraction_2_id, combo_price, discount_percent, active, created_at, updated_at, name, attraction_ids, attraction_prices, total_price, image_url, create_slots) FROM stdin;
4	\N	\N	\N	0.00	t	2025-11-29 12:29:22.917397+00	2025-12-03 06:38:02.94619+00	Snow city + Madlabs + Eyelusion	{1,2,3}	{"1": 500, "2": 400, "3": 300}	1200.00	/uploads/2025/12/03/1764743878299_ez6x3g3it67.webp	t
1	1	2	850.00	0.00	t	2025-11-28 11:40:36.40424+00	2025-12-03 06:38:19.99401+00	Snowcity + MadLabs	{1,2}	{"1": 425, "2": 425}	850.00	/uploads/2025/12/03/1764743897470_beyvh324a67.webp	t
\.


--
-- TOC entry 4105 (class 0 OID 19145)
-- Dependencies: 267
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.coupons (coupon_id, code, description, type, value, attraction_id, min_amount, valid_from, valid_to, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4089 (class 0 OID 18849)
-- Dependencies: 251
-- Data for Name: gallery_items; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.gallery_items (gallery_item_id, media_type, url, title, description, target_type, target_ref_id, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4119 (class 0 OID 19297)
-- Dependencies: 281
-- Data for Name: happy_hours; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.happy_hours (hh_id, attraction_id, start_time, end_time, discount_percent, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4117 (class 0 OID 19283)
-- Dependencies: 279
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.holidays (holiday_id, holiday_date, description, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4107 (class 0 OID 19177)
-- Dependencies: 269
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.media_files (media_id, url_path, relative_path, filename, size, mimetype, folder, created_at) FROM stdin;
1	/uploads/2025/11/28/1764329570056_b0gry0yr36e.webp	2025/11/28/1764329570056_b0gry0yr36e.webp	1764329570056_b0gry0yr36e.webp	112348	image/webp		2025-11-28 11:32:49.716989+00
2	/uploads/2025/11/28/1764329582310_zlgsjgysexa.webp	2025/11/28/1764329582310_zlgsjgysexa.webp	1764329582310_zlgsjgysexa.webp	132997	image/webp		2025-11-28 11:33:01.968614+00
3	/uploads/2025/11/28/1764329610307_znjg1r8ngh.png	2025/11/28/1764329610307_znjg1r8ngh.png	1764329610307_znjg1r8ngh.png	178965	image/png		2025-11-28 11:33:29.968137+00
4	/uploads/2025/11/28/1764329618769_a218uo0rtok.png	2025/11/28/1764329618769_a218uo0rtok.png	1764329618769_a218uo0rtok.png	206371	image/png		2025-11-28 11:33:38.428305+00
5	/uploads/2025/11/28/1764329641502_8xjox2ng028.webp	2025/11/28/1764329641502_8xjox2ng028.webp	1764329641502_8xjox2ng028.webp	41088	image/webp		2025-11-28 11:34:01.214062+00
6	/uploads/2025/11/28/1764329642524_ee4nsdl1i35.webp	2025/11/28/1764329642524_ee4nsdl1i35.webp	1764329642524_ee4nsdl1i35.webp	102499	image/webp		2025-11-28 11:34:02.182694+00
7	/uploads/2025/11/28/1764329786776_l5r8udk5ben.webp	2025/11/28/1764329786776_l5r8udk5ben.webp	1764329786776_l5r8udk5ben.webp	158758	image/webp		2025-11-28 11:36:26.435888+00
8	/uploads/2025/11/28/1764329840112_2h2eyuv0ru9.webp	2025/11/28/1764329840112_2h2eyuv0ru9.webp	1764329840112_2h2eyuv0ru9.webp	185421	image/webp		2025-11-28 11:37:19.768773+00
9	/uploads/2025/11/29/1764419208424_grw9o5ppifk.webp	2025/11/29/1764419208424_grw9o5ppifk.webp	1764419208424_grw9o5ppifk.webp	19325	image/webp		2025-11-29 12:26:48.037858+00
10	/uploads/2025/12/03/1764743878299_ez6x3g3it67.webp	2025/12/03/1764743878299_ez6x3g3it67.webp	1764743878299_ez6x3g3it67.webp	40671	image/webp		2025-12-03 06:37:58.313328+00
11	/uploads/2025/12/03/1764743897470_beyvh324a67.webp	2025/12/03/1764743897470_beyvh324a67.webp	1764743897470_beyvh324a67.webp	40671	image/webp		2025-12-03 06:38:17.475374+00
12	/uploads/2025/12/03/1764757912237_m8xkaa2r9t.png	2025/12/03/1764757912237_m8xkaa2r9t.png	1764757912237_m8xkaa2r9t.png	8265	image/png		2025-12-03 10:31:52.025655+00
\.


--
-- TOC entry 4115 (class 0 OID 19256)
-- Dependencies: 277
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.notifications (notification_id, user_id, booking_id, channel, status, message, sent_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4083 (class 0 OID 18766)
-- Dependencies: 245
-- Data for Name: offer_rules; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.offer_rules (rule_id, offer_id, target_type, target_id, applies_to_all, date_from, date_to, time_from, time_to, slot_type, slot_id, rule_discount_type, rule_discount_value, priority, created_at, updated_at, day_type, specific_days, is_holiday, specific_date, specific_time) FROM stdin;
\.


--
-- TOC entry 4081 (class 0 OID 18746)
-- Dependencies: 243
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.offers (offer_id, title, description, image_url, rule_type, discount_type, discount_value, max_discount, valid_from, valid_to, active, created_at, updated_at) FROM stdin;
2	happy hours			happy_hour	amount	250.00	\N	2025-12-03	2025-12-31	t	2025-12-03 11:07:02.565883+00	2025-12-03 12:33:46.191085+00
\.


--
-- TOC entry 4093 (class 0 OID 18896)
-- Dependencies: 255
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.orders (order_id, order_ref, user_id, total_amount, discount_amount, payment_status, payment_mode, payment_ref, payment_txn_no, coupon_code, created_at, updated_at) FROM stdin;
1	ORD2025112895158f	3	1500.00	0.00	Completed	Online	R41c51923-6aa1-4a0a-8e1b-b30d12f94f3c	\N	\N	2025-11-28 12:06:28.485718+00	2025-11-28 12:07:50.249605+00
2	ORD20251128498fe7	3	1000.00	0.00	Completed	Online	R6337f7f1-5beb-44a4-be00-76531696bbcc	\N	\N	2025-11-28 13:06:02.81135+00	2025-11-28 13:06:59.278924+00
15	ORD2025112938dfca	3	1500.00	0.00	Completed	Online	R76fca161-50f3-46ea-903a-e2454503e387	\N	\N	2025-11-29 10:11:06.988885+00	2025-11-29 10:12:17.613881+00
3	ORD20251129a806b7	3	2350.00	0.00	Completed	Online	R2e551bc8-365c-4837-b379-339822f069e6	\N	\N	2025-11-29 07:46:36.456974+00	2025-11-29 07:47:33.638187+00
24	ORD202512037c41be	3	2700.00	0.00	Completed	Online	R25cac27f-9e86-4b4b-82fe-ec4df19e18e5	\N	\N	2025-12-03 08:19:07.480882+00	2025-12-03 08:20:00.344878+00
4	ORD20251129f3386c	3	1700.00	0.00	Completed	Online	R8ac1c0a5-2040-410b-a8a6-17323c8996b4	\N	\N	2025-11-29 07:56:26.021288+00	2025-11-29 07:57:23.742894+00
16	ORD20251129f0856f	3	850.00	0.00	Completed	Online	R58ebc98c-8f73-412d-83fb-7fe5b42f5745	\N	\N	2025-11-29 10:22:28.6309+00	2025-11-29 10:23:54.546326+00
5	ORD202511293bf09e	3	850.00	0.00	Completed	Online	Rbff931cb-1904-4e78-a4d2-35a470eedae1	\N	\N	2025-11-29 08:03:28.451148+00	2025-11-29 08:04:21.753251+00
6	ORD20251129829cf6	3	1700.00	0.00	Completed	Online	R64d5052b-7e3e-444f-bfe7-e092591a729b	\N	\N	2025-11-29 08:10:19.409271+00	2025-11-29 08:11:13.879308+00
7	ORD202511299ff7f4	3	750.00	0.00	Completed	Online	R164698a5-6c22-4999-a600-119f2218b77e	\N	\N	2025-11-29 08:13:29.816721+00	2025-11-29 08:14:21.746199+00
17	ORD202511294a9cda	3	1000.00	0.00	Completed	Online	R9c5a0435-f992-4114-8535-b4cefb73ff60	\N	\N	2025-11-29 10:29:24.275478+00	2025-11-29 10:30:18.375565+00
8	ORD20251129fb7732	3	1000.00	0.00	Completed	Online	Rccf1d9f2-c9f8-4471-89ae-94c6ed1c6548	\N	\N	2025-11-29 08:43:06.404024+00	2025-11-29 08:44:01.767712+00
9	ORD20251129bd4204	3	1500.00	0.00	Completed	Online	Rbdbc283d-8339-4783-9236-5b2ea2ae8bb0	\N	\N	2025-11-29 08:47:11.621772+00	2025-11-29 08:48:03.6567+00
18	ORD20251129acee6f	3	1500.00	0.00	Completed	Online	R3f4af05c-76dc-429c-bf34-d6433c75ea12	\N	\N	2025-11-29 10:43:07.19553+00	2025-11-29 10:44:24.586272+00
10	ORD20251129ce72fc	3	750.00	0.00	Completed	Online	Rf347702c-5572-4be6-9060-7fe04223c58a	\N	\N	2025-11-29 08:56:40.41078+00	2025-11-29 08:57:33.8689+00
11	ORD2025112908964b	3	2600.00	0.00	Completed	Online	R4a13160a-7a44-469c-9156-ddc8b6ce44b9	\N	\N	2025-11-29 09:09:25.97432+00	2025-11-29 09:10:23.494444+00
12	ORD202511296f977f	3	2500.00	0.00	Completed	Online	R342313dc-fda2-4dc9-b812-ec0b3a859b77	\N	\N	2025-11-29 09:20:34.354901+00	2025-11-29 09:21:52.008435+00
13	ORD20251129aa1d2b	3	3200.00	0.00	Completed	Online	R619841a3-fff6-45b0-9251-86f5e3043db7	\N	\N	2025-11-29 09:31:20.01475+00	2025-11-29 09:32:28.982408+00
19	ORD2025112949f80c	3	1500.00	0.00	Completed	Online	R292c9c53-654e-4b9a-bcdf-751807467c52	\N	\N	2025-11-29 10:49:36.906121+00	2025-11-29 10:50:47.666096+00
14	ORD202511293f4da3	3	1000.00	0.00	Completed	Online	R6313042f-df01-40cf-bdd0-cf39590ad028	\N	\N	2025-11-29 09:59:52.019749+00	2025-11-29 10:00:52.444478+00
21	ORD20251129631f08	3	750.00	0.00	Completed	Online	R48c06cd0-256a-48e4-b4ee-e5987509d3d7	\N	\N	2025-11-29 10:57:49.167875+00	2025-11-29 11:01:27.018477+00
22	ORD20251129544579	3	2500.00	0.00	Completed	Online	R144f6b36-5a2f-4777-b481-e310e554bb1d	\N	\N	2025-11-29 11:03:37.359682+00	2025-11-29 11:04:47.252456+00
23	ORD20251203fbb522	3	1500.00	0.00	Completed	Online	R4d2a5dd9-1552-4ff9-8786-58707c1b137e	\N	\N	2025-12-03 06:21:10.039028+00	2025-12-03 06:22:07.773841+00
\.


--
-- TOC entry 4123 (class 0 OID 19358)
-- Dependencies: 285
-- Data for Name: payment_txn_logs; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.payment_txn_logs (txn_id, booking_id, cart_id, payment_ref, payment_txn_no, gateway, amount, status, response_code, response_data, error_message, retries, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4065 (class 0 OID 18512)
-- Dependencies: 227
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.permissions (permission_id, permission_key, description, created_at, updated_at) FROM stdin;
1	attractions.view	Permission for attractions.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
2	attractions.create	Permission for attractions.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
3	attractions.update	Permission for attractions.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
4	attractions.delete	Permission for attractions.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
5	combos.view	Permission for combos.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
6	combos.create	Permission for combos.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
7	combos.update	Permission for combos.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
8	combos.delete	Permission for combos.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
9	bookings.view	Permission for bookings.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
10	bookings.update	Permission for bookings.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
11	bookings.delete	Permission for bookings.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
12	bookings.export	Permission for bookings.export	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
13	users.view	Permission for users.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
14	users.create	Permission for users.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
15	users.update	Permission for users.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
16	users.delete	Permission for users.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
17	users.manage_roles	Permission for users.manage_roles	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
18	analytics.view	Permission for analytics.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
19	analytics.export	Permission for analytics.export	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
20	reports.view	Permission for reports.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
21	reports.export	Permission for reports.export	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
22	blogs.view	Permission for blogs.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
23	blogs.create	Permission for blogs.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
24	blogs.update	Permission for blogs.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
25	blogs.delete	Permission for blogs.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
26	pages.view	Permission for pages.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
27	pages.create	Permission for pages.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
28	pages.update	Permission for pages.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
29	pages.delete	Permission for pages.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
30	gallery.view	Permission for gallery.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
31	gallery.create	Permission for gallery.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
32	gallery.update	Permission for gallery.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
33	gallery.delete	Permission for gallery.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
34	offers.view	Permission for offers.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
35	offers.create	Permission for offers.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
36	offers.update	Permission for offers.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
37	offers.delete	Permission for offers.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
38	coupons.view	Permission for coupons.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
39	coupons.create	Permission for coupons.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
40	coupons.update	Permission for coupons.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
41	coupons.delete	Permission for coupons.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
42	settings.view	Permission for settings.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
43	settings.update	Permission for settings.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
44	notifications.view	Permission for notifications.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
45	notifications.send	Permission for notifications.send	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
46	slots.view	Permission for slots.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
47	slots.create	Permission for slots.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
48	slots.update	Permission for slots.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
49	slots.delete	Permission for slots.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
50	holidays.view	Permission for holidays.view	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
51	holidays.create	Permission for holidays.create	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
52	holidays.update	Permission for holidays.update	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
53	holidays.delete	Permission for holidays.delete	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
\.


--
-- TOC entry 4067 (class 0 OID 18529)
-- Dependencies: 229
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.role_permissions (id, role_id, permission_id, created_at, updated_at) FROM stdin;
1	1	1	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
2	1	2	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
3	1	3	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
4	1	4	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
5	1	5	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
6	1	6	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
7	1	7	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
8	1	8	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
9	1	9	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
10	1	10	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
11	1	11	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
12	1	12	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
13	1	13	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
14	1	14	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
15	1	15	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
16	1	16	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
17	1	17	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
18	1	18	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
19	1	19	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
20	1	20	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
21	1	21	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
22	1	22	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
23	1	23	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
24	1	24	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
25	1	25	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
26	1	26	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
27	1	27	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
28	1	28	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
29	1	29	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
30	1	30	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
31	1	31	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
32	1	32	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
33	1	33	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
34	1	34	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
35	1	35	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
36	1	36	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
37	1	37	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
38	1	38	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
39	1	39	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
40	1	40	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
41	1	41	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
42	1	42	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
43	1	43	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
44	1	44	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
45	1	45	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
46	1	46	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
47	1	47	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
48	1	48	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
49	1	49	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
50	1	50	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
51	1	51	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
52	1	52	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
53	1	53	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
54	2	1	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
55	2	5	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
56	2	9	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
57	2	18	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
58	2	22	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
59	2	26	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
60	2	30	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
61	2	34	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
62	2	38	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
63	2	46	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
64	2	50	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
65	2	20	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
66	3	1	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
67	3	5	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
68	3	34	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
69	3	38	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
\.


--
-- TOC entry 4063 (class 0 OID 18495)
-- Dependencies: 225
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.roles (role_id, role_name, description, created_at, updated_at) FROM stdin;
1	admin	Full admin access to all dashboard modules	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
2	sub_admin	Limited admin access for specific modules	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
3	user	Normal user with basic access	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
\.


--
-- TOC entry 4111 (class 0 OID 19224)
-- Dependencies: 273
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.settings (setting_id, key_name, key_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4069 (class 0 OID 18554)
-- Dependencies: 231
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.user_roles (id, user_id, role_id, created_at, updated_at) FROM stdin;
1	1	1	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
2	2	2	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
3	3	3	2025-11-28 12:06:17.293233+00	2025-11-28 12:06:17.293233+00
4	4	1	2025-11-28 12:30:54.753511+00	2025-11-28 12:30:54.753511+00
\.


--
-- TOC entry 4061 (class 0 OID 18471)
-- Dependencies: 223
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.users (user_id, name, email, phone, password_hash, otp_code, otp_expires_at, otp_verified, jwt_token, jwt_expires_at, last_login_at, last_ip, created_at, updated_at) FROM stdin;
2	Sub Admin	subadmin@snowcity.local	\N	$2b$10$GnQdjWaPDl3mCLtPqejAx.CJyEHgcFz2U/BFgLrP/7gB7zeuT/GE6	\N	\N	t	\N	\N	\N	\N	2025-11-28 11:14:24.512069+00	2025-11-28 11:14:24.512069+00
3	basteen	santhiyagubasteen@gmail.com	+919345318251	\N	\N	\N	t	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzIiwiZW1haWwiOiJzYW50aGl5YWd1YmFzdGVlbkBnbWFpbC5jb20iLCJpYXQiOjE3NjQzMzE1ODQsImV4cCI6MTc2NDkzNjM4NH0.umYJ1AIpP-huRa-6kAwlZiSzbALQGFIqEfyh5VHm9F4	2025-12-05 12:06:24.028+00	2025-11-28 12:06:23.559127+00	\N	2025-11-28 12:06:17.293233+00	2025-11-28 12:06:23.655998+00
4	Admin	basteen@gmail.com	\N	$2b$10$LBnwciL816hiOvB6lg0j4uEhqhq8t.1kq3YhTRriZ4i6OUqCh05ea	\N	\N	t	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0IiwiZW1haWwiOiJiYXN0ZWVuQGdtYWlsLmNvbSIsImlhdCI6MTc2NDMzMzc2NiwiZXhwIjoxNzY0OTM4NTY2fQ.Tqebe4xDPQ9sKldQh8GMPHcPDN_g9fldH5FoK2_VzPM	2025-12-05 12:42:46.032+00	2025-11-28 12:42:45.666123+00	\N	2025-11-28 12:30:54.753511+00	2025-11-28 12:42:45.666123+00
1	Super Admin	admin@snowcity.local	\N	$2b$10$.U4Oq6zz79hnK81SPjKm5O.cm1BrTZgq3/b2zkK53h.a7mebOh2iW	\N	\N	t	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBzbm93Y2l0eS5sb2NhbCIsImlhdCI6MTc2NDMzNDA3MCwiZXhwIjoxNzY0OTM4ODcwfQ.DvE6gX60lJNmGBg32EmhB1LBAwHGy1bv1lbKOwMpcsE	2025-12-05 12:47:50.148+00	2025-11-28 12:47:49.778465+00	\N	2025-11-28 11:14:24.512069+00	2025-11-28 12:47:49.778465+00
\.


--
-- TOC entry 4188 (class 0 OID 0)
-- Dependencies: 240
-- Name: addons_addon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.addons_addon_id_seq', 1, true);


--
-- TOC entry 4189 (class 0 OID 0)
-- Dependencies: 270
-- Name: analytics_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.analytics_analytics_id_seq', 1, false);


--
-- TOC entry 4190 (class 0 OID 0)
-- Dependencies: 274
-- Name: api_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.api_logs_log_id_seq', 1, false);


--
-- TOC entry 4191 (class 0 OID 0)
-- Dependencies: 234
-- Name: attraction_slots_slot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.attraction_slots_slot_id_seq', 3738, true);


--
-- TOC entry 4192 (class 0 OID 0)
-- Dependencies: 232
-- Name: attractions_attraction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.attractions_attraction_id_seq', 3, true);


--
-- TOC entry 4193 (class 0 OID 0)
-- Dependencies: 252
-- Name: banners_banner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.banners_banner_id_seq', 3, true);


--
-- TOC entry 4194 (class 0 OID 0)
-- Dependencies: 248
-- Name: blogs_blog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.blogs_blog_id_seq', 1, false);


--
-- TOC entry 4195 (class 0 OID 0)
-- Dependencies: 258
-- Name: booking_addons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.booking_addons_id_seq', 1, false);


--
-- TOC entry 4196 (class 0 OID 0)
-- Dependencies: 282
-- Name: booking_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.booking_history_history_id_seq', 1, false);


--
-- TOC entry 4197 (class 0 OID 0)
-- Dependencies: 220
-- Name: booking_ref_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.booking_ref_seq', 32, true);


--
-- TOC entry 4198 (class 0 OID 0)
-- Dependencies: 256
-- Name: bookings_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.bookings_booking_id_seq', 32, true);


--
-- TOC entry 4199 (class 0 OID 0)
-- Dependencies: 264
-- Name: cart_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.cart_bookings_id_seq', 1, false);


--
-- TOC entry 4200 (class 0 OID 0)
-- Dependencies: 262
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.cart_items_cart_item_id_seq', 1, false);


--
-- TOC entry 4201 (class 0 OID 0)
-- Dependencies: 221
-- Name: cart_ref_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.cart_ref_seq', 1, false);


--
-- TOC entry 4202 (class 0 OID 0)
-- Dependencies: 260
-- Name: carts_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.carts_cart_id_seq', 1, false);


--
-- TOC entry 4203 (class 0 OID 0)
-- Dependencies: 246
-- Name: cms_pages_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.cms_pages_page_id_seq', 1, false);


--
-- TOC entry 4204 (class 0 OID 0)
-- Dependencies: 236
-- Name: combo_attractions_combo_attraction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.combo_attractions_combo_attraction_id_seq', 27, true);


--
-- TOC entry 4205 (class 0 OID 0)
-- Dependencies: 238
-- Name: combo_slots_combo_slot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.combo_slots_combo_slot_id_seq', 1683, true);


--
-- TOC entry 4206 (class 0 OID 0)
-- Dependencies: 286
-- Name: combos_combo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.combos_combo_id_seq', 4, true);


--
-- TOC entry 4207 (class 0 OID 0)
-- Dependencies: 266
-- Name: coupons_coupon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.coupons_coupon_id_seq', 1, false);


--
-- TOC entry 4208 (class 0 OID 0)
-- Dependencies: 250
-- Name: gallery_items_gallery_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.gallery_items_gallery_item_id_seq', 1, false);


--
-- TOC entry 4209 (class 0 OID 0)
-- Dependencies: 280
-- Name: happy_hours_hh_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.happy_hours_hh_id_seq', 1, false);


--
-- TOC entry 4210 (class 0 OID 0)
-- Dependencies: 278
-- Name: holidays_holiday_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.holidays_holiday_id_seq', 1, false);


--
-- TOC entry 4211 (class 0 OID 0)
-- Dependencies: 268
-- Name: media_files_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.media_files_media_id_seq', 12, true);


--
-- TOC entry 4212 (class 0 OID 0)
-- Dependencies: 276
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);


--
-- TOC entry 4213 (class 0 OID 0)
-- Dependencies: 244
-- Name: offer_rules_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.offer_rules_rule_id_seq', 7, true);


--
-- TOC entry 4214 (class 0 OID 0)
-- Dependencies: 242
-- Name: offers_offer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.offers_offer_id_seq', 2, true);


--
-- TOC entry 4215 (class 0 OID 0)
-- Dependencies: 254
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 24, true);


--
-- TOC entry 4216 (class 0 OID 0)
-- Dependencies: 284
-- Name: payment_txn_logs_txn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.payment_txn_logs_txn_id_seq', 1, false);


--
-- TOC entry 4217 (class 0 OID 0)
-- Dependencies: 226
-- Name: permissions_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.permissions_permission_id_seq', 53, true);


--
-- TOC entry 4218 (class 0 OID 0)
-- Dependencies: 228
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 69, true);


--
-- TOC entry 4219 (class 0 OID 0)
-- Dependencies: 224
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 3, true);


--
-- TOC entry 4220 (class 0 OID 0)
-- Dependencies: 272
-- Name: settings_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.settings_setting_id_seq', 1, false);


--
-- TOC entry 4221 (class 0 OID 0)
-- Dependencies: 230
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 4, true);


--
-- TOC entry 4222 (class 0 OID 0)
-- Dependencies: 222
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- TOC entry 3760 (class 2606 OID 18744)
-- Name: addons addons_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_pkey PRIMARY KEY (addon_id);


--
-- TOC entry 3819 (class 2606 OID 19214)
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (analytics_id);


--
-- TOC entry 3827 (class 2606 OID 19254)
-- Name: api_logs api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 3740 (class 2606 OID 18629)
-- Name: attraction_slots attraction_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attraction_slots
    ADD CONSTRAINT attraction_slots_pkey PRIMARY KEY (slot_id);


--
-- TOC entry 3736 (class 2606 OID 18604)
-- Name: attractions attractions_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attractions
    ADD CONSTRAINT attractions_pkey PRIMARY KEY (attraction_id);


--
-- TOC entry 3738 (class 2606 OID 18606)
-- Name: attractions attractions_slug_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attractions
    ADD CONSTRAINT attractions_slug_key UNIQUE (slug);


--
-- TOC entry 3779 (class 2606 OID 18884)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (banner_id);


--
-- TOC entry 3771 (class 2606 OID 18844)
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (blog_id);


--
-- TOC entry 3773 (class 2606 OID 18846)
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- TOC entry 3793 (class 2606 OID 19027)
-- Name: booking_addons booking_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_addons
    ADD CONSTRAINT booking_addons_pkey PRIMARY KEY (id);


--
-- TOC entry 3837 (class 2606 OID 19343)
-- Name: booking_history booking_history_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 3787 (class 2606 OID 18966)
-- Name: bookings bookings_booking_ref_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_ref_key UNIQUE (booking_ref);


--
-- TOC entry 3789 (class 2606 OID 18964)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- TOC entry 3809 (class 2606 OID 19131)
-- Name: cart_bookings cart_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_bookings
    ADD CONSTRAINT cart_bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 3804 (class 2606 OID 19099)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 3797 (class 2606 OID 19069)
-- Name: carts carts_cart_ref_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_cart_ref_key UNIQUE (cart_ref);


--
-- TOC entry 3799 (class 2606 OID 19067)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- TOC entry 3766 (class 2606 OID 18818)
-- Name: cms_pages cms_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cms_pages
    ADD CONSTRAINT cms_pages_pkey PRIMARY KEY (page_id);


--
-- TOC entry 3768 (class 2606 OID 18820)
-- Name: cms_pages cms_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cms_pages
    ADD CONSTRAINT cms_pages_slug_key UNIQUE (slug);


--
-- TOC entry 3746 (class 2606 OID 18679)
-- Name: combo_attractions combo_attractions_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_attractions
    ADD CONSTRAINT combo_attractions_pkey PRIMARY KEY (combo_attraction_id);


--
-- TOC entry 3752 (class 2606 OID 18715)
-- Name: combo_slots combo_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_slots
    ADD CONSTRAINT combo_slots_pkey PRIMARY KEY (combo_slot_id);


--
-- TOC entry 3852 (class 2606 OID 19425)
-- Name: combos combos_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_pkey PRIMARY KEY (combo_id);


--
-- TOC entry 3813 (class 2606 OID 19170)
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- TOC entry 3815 (class 2606 OID 19168)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id);


--
-- TOC entry 3775 (class 2606 OID 18868)
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (gallery_item_id);


--
-- TOC entry 3835 (class 2606 OID 19313)
-- Name: happy_hours happy_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.happy_hours
    ADD CONSTRAINT happy_hours_pkey PRIMARY KEY (hh_id);


--
-- TOC entry 3831 (class 2606 OID 19295)
-- Name: holidays holidays_holiday_date_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_holiday_date_key UNIQUE (holiday_date);


--
-- TOC entry 3833 (class 2606 OID 19293)
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (holiday_id);


--
-- TOC entry 3817 (class 2606 OID 19191)
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (media_id);


--
-- TOC entry 3829 (class 2606 OID 19270)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 3764 (class 2606 OID 18786)
-- Name: offer_rules offer_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.offer_rules
    ADD CONSTRAINT offer_rules_pkey PRIMARY KEY (rule_id);


--
-- TOC entry 3762 (class 2606 OID 18763)
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (offer_id);


--
-- TOC entry 3783 (class 2606 OID 18916)
-- Name: orders orders_order_ref_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_ref_key UNIQUE (order_ref);


--
-- TOC entry 3785 (class 2606 OID 18914)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 3846 (class 2606 OID 19377)
-- Name: payment_txn_logs payment_txn_logs_payment_ref_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.payment_txn_logs
    ADD CONSTRAINT payment_txn_logs_payment_ref_key UNIQUE (payment_ref);


--
-- TOC entry 3848 (class 2606 OID 19379)
-- Name: payment_txn_logs payment_txn_logs_payment_txn_no_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.payment_txn_logs
    ADD CONSTRAINT payment_txn_logs_payment_txn_no_key UNIQUE (payment_txn_no);


--
-- TOC entry 3850 (class 2606 OID 19375)
-- Name: payment_txn_logs payment_txn_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.payment_txn_logs
    ADD CONSTRAINT payment_txn_logs_pkey PRIMARY KEY (txn_id);


--
-- TOC entry 3724 (class 2606 OID 18526)
-- Name: permissions permissions_permission_key_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_permission_key_key UNIQUE (permission_key);


--
-- TOC entry 3726 (class 2606 OID 18524)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- TOC entry 3728 (class 2606 OID 18540)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3720 (class 2606 OID 18507)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3722 (class 2606 OID 18509)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 3823 (class 2606 OID 19239)
-- Name: settings settings_key_name_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_name_key UNIQUE (key_name);


--
-- TOC entry 3825 (class 2606 OID 19237)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_id);


--
-- TOC entry 3821 (class 2606 OID 19216)
-- Name: analytics uq_analytics_day; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT uq_analytics_day UNIQUE (attraction_id, report_date);


--
-- TOC entry 3742 (class 2606 OID 18633)
-- Name: attraction_slots uq_attraction_slots_slot_code; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attraction_slots
    ADD CONSTRAINT uq_attraction_slots_slot_code UNIQUE (attraction_id, slot_code);


--
-- TOC entry 3795 (class 2606 OID 19029)
-- Name: booking_addons uq_booking_addon; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_addons
    ADD CONSTRAINT uq_booking_addon UNIQUE (booking_id, addon_id);


--
-- TOC entry 3811 (class 2606 OID 19133)
-- Name: cart_bookings uq_cart_booking; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_bookings
    ADD CONSTRAINT uq_cart_booking UNIQUE (cart_id, booking_id);


--
-- TOC entry 3748 (class 2606 OID 18681)
-- Name: combo_attractions uq_combo_attraction; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_attractions
    ADD CONSTRAINT uq_combo_attraction UNIQUE (combo_id, attraction_id);


--
-- TOC entry 3750 (class 2606 OID 18683)
-- Name: combo_attractions uq_combo_position; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_attractions
    ADD CONSTRAINT uq_combo_position UNIQUE (combo_id, position_in_combo);


--
-- TOC entry 3754 (class 2606 OID 19443)
-- Name: combo_slots uq_combo_slot_code; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_slots
    ADD CONSTRAINT uq_combo_slot_code UNIQUE (combo_slot_code);


--
-- TOC entry 3756 (class 2606 OID 18719)
-- Name: combo_slots uq_combo_slots_code; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_slots
    ADD CONSTRAINT uq_combo_slots_code UNIQUE (combo_id, combo_slot_code);


--
-- TOC entry 3758 (class 2606 OID 18717)
-- Name: combo_slots uq_combo_slots_window; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_slots
    ADD CONSTRAINT uq_combo_slots_window UNIQUE (combo_id, start_date, end_date, start_time, end_time);


--
-- TOC entry 3730 (class 2606 OID 18542)
-- Name: role_permissions uq_role_perm; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_perm UNIQUE (role_id, permission_id);


--
-- TOC entry 3744 (class 2606 OID 18631)
-- Name: attraction_slots uq_slot_window; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attraction_slots
    ADD CONSTRAINT uq_slot_window UNIQUE (attraction_id, start_date, end_date, start_time, end_time);


--
-- TOC entry 3732 (class 2606 OID 18567)
-- Name: user_roles uq_user_role; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_role UNIQUE (user_id, role_id);


--
-- TOC entry 3734 (class 2606 OID 18565)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3714 (class 2606 OID 18490)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3716 (class 2606 OID 18492)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3718 (class 2606 OID 18488)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3838 (class 1259 OID 19354)
-- Name: idx_booking_history_booking_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_booking_history_booking_id ON public.booking_history USING btree (booking_id);


--
-- TOC entry 3839 (class 1259 OID 19356)
-- Name: idx_booking_history_created_at; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_booking_history_created_at ON public.booking_history USING btree (created_at);


--
-- TOC entry 3840 (class 1259 OID 19355)
-- Name: idx_booking_history_new_status; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_booking_history_new_status ON public.booking_history USING btree (new_status);


--
-- TOC entry 3790 (class 1259 OID 19007)
-- Name: idx_bookings_order_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_bookings_order_id ON public.bookings USING btree (order_id);


--
-- TOC entry 3791 (class 1259 OID 19008)
-- Name: idx_bookings_parent_booking_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_bookings_parent_booking_id ON public.bookings USING btree (parent_booking_id);


--
-- TOC entry 3805 (class 1259 OID 19327)
-- Name: idx_cart_items_cart_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);


--
-- TOC entry 3806 (class 1259 OID 19329)
-- Name: idx_cart_items_slot_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_cart_items_slot_id ON public.cart_items USING btree (slot_id);


--
-- TOC entry 3807 (class 1259 OID 19328)
-- Name: idx_cart_items_type; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_cart_items_type ON public.cart_items USING btree (item_type);


--
-- TOC entry 3800 (class 1259 OID 19325)
-- Name: idx_carts_session_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_carts_session_id ON public.carts USING btree (session_id);


--
-- TOC entry 3801 (class 1259 OID 19326)
-- Name: idx_carts_status; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_carts_status ON public.carts USING btree (status);


--
-- TOC entry 3802 (class 1259 OID 19324)
-- Name: idx_carts_user_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_carts_user_id ON public.carts USING btree (user_id);


--
-- TOC entry 3769 (class 1259 OID 19405)
-- Name: idx_cms_pages_nav_group; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_cms_pages_nav_group ON public.cms_pages USING btree (nav_group);


--
-- TOC entry 3776 (class 1259 OID 19400)
-- Name: idx_gallery_items_active; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_gallery_items_active ON public.gallery_items USING btree (active);


--
-- TOC entry 3777 (class 1259 OID 19404)
-- Name: idx_gallery_items_target; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_gallery_items_target ON public.gallery_items USING btree (target_type, target_ref_id);


--
-- TOC entry 3780 (class 1259 OID 18922)
-- Name: idx_orders_payment_txn_no; Type: INDEX; Schema: public; Owner: root
--

CREATE UNIQUE INDEX idx_orders_payment_txn_no ON public.orders USING btree (payment_txn_no) WHERE (payment_txn_no IS NOT NULL);


--
-- TOC entry 3781 (class 1259 OID 19403)
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- TOC entry 3841 (class 1259 OID 19391)
-- Name: idx_payment_txn_logs_booking_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_payment_txn_logs_booking_id ON public.payment_txn_logs USING btree (booking_id);


--
-- TOC entry 3842 (class 1259 OID 19392)
-- Name: idx_payment_txn_logs_cart_id; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_payment_txn_logs_cart_id ON public.payment_txn_logs USING btree (cart_id);


--
-- TOC entry 3843 (class 1259 OID 19393)
-- Name: idx_payment_txn_logs_ref; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_payment_txn_logs_ref ON public.payment_txn_logs USING btree (payment_ref);


--
-- TOC entry 3844 (class 1259 OID 19394)
-- Name: idx_payment_txn_logs_status; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_payment_txn_logs_status ON public.payment_txn_logs USING btree (status);


--
-- TOC entry 3905 (class 2620 OID 19222)
-- Name: analytics trg_analytics_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3893 (class 2620 OID 18639)
-- Name: attraction_slots trg_attraction_slots_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_attraction_slots_updated_at BEFORE UPDATE ON public.attraction_slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3892 (class 2620 OID 18607)
-- Name: attractions trg_attractions_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_attractions_updated_at BEFORE UPDATE ON public.attractions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3899 (class 2620 OID 18847)
-- Name: blogs trg_blogs_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3902 (class 2620 OID 19009)
-- Name: bookings trg_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3904 (class 2620 OID 19120)
-- Name: cart_items trg_cart_items_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3903 (class 2620 OID 19075)
-- Name: carts trg_carts_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3898 (class 2620 OID 18821)
-- Name: cms_pages trg_cms_pages_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3896 (class 2620 OID 18725)
-- Name: combo_slots trg_combo_slots_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_combo_slots_updated_at BEFORE UPDATE ON public.combo_slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3909 (class 2620 OID 19438)
-- Name: combos trg_combos_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_combos_updated_at BEFORE UPDATE ON public.combos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3900 (class 2620 OID 18869)
-- Name: gallery_items trg_gallery_items_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3907 (class 2620 OID 19281)
-- Name: notifications trg_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3897 (class 2620 OID 18764)
-- Name: offers trg_offers_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3901 (class 2620 OID 18923)
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3908 (class 2620 OID 19390)
-- Name: payment_txn_logs trg_payment_txn_logs_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_payment_txn_logs_updated_at BEFORE UPDATE ON public.payment_txn_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3891 (class 2620 OID 18527)
-- Name: permissions trg_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3890 (class 2620 OID 18510)
-- Name: roles trg_roles_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3906 (class 2620 OID 19240)
-- Name: settings trg_settings_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3894 (class 2620 OID 19520)
-- Name: combo_attractions trg_update_combo_details; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_update_combo_details AFTER INSERT OR DELETE OR UPDATE ON public.combo_attractions FOR EACH ROW EXECUTE FUNCTION public.update_combo_details();


--
-- TOC entry 3889 (class 2620 OID 18493)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3895 (class 2620 OID 19322)
-- Name: combo_attractions trg_validate_combo_attractions; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trg_validate_combo_attractions BEFORE INSERT OR UPDATE ON public.combo_attractions FOR EACH ROW EXECUTE FUNCTION public.validate_combo_attractions();


--
-- TOC entry 3879 (class 2606 OID 19217)
-- Name: analytics analytics_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3857 (class 2606 OID 18634)
-- Name: attraction_slots attraction_slots_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.attraction_slots
    ADD CONSTRAINT attraction_slots_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3860 (class 2606 OID 18885)
-- Name: banners banners_linked_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_linked_attraction_id_fkey FOREIGN KEY (linked_attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3861 (class 2606 OID 18890)
-- Name: banners banners_linked_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_linked_offer_id_fkey FOREIGN KEY (linked_offer_id) REFERENCES public.offers(offer_id) ON DELETE CASCADE;


--
-- TOC entry 3870 (class 2606 OID 19035)
-- Name: booking_addons booking_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_addons
    ADD CONSTRAINT booking_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.addons(addon_id) ON DELETE RESTRICT;


--
-- TOC entry 3871 (class 2606 OID 19030)
-- Name: booking_addons booking_addons_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_addons
    ADD CONSTRAINT booking_addons_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 3883 (class 2606 OID 19344)
-- Name: booking_history booking_history_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 3884 (class 2606 OID 19349)
-- Name: booking_history booking_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3863 (class 2606 OID 18977)
-- Name: bookings bookings_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE RESTRICT;


--
-- TOC entry 3864 (class 2606 OID 18992)
-- Name: bookings bookings_combo_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_combo_slot_id_fkey FOREIGN KEY (combo_slot_id) REFERENCES public.combo_slots(combo_slot_id) ON DELETE SET NULL;


--
-- TOC entry 3865 (class 2606 OID 18997)
-- Name: bookings bookings_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(offer_id) ON DELETE SET NULL;


--
-- TOC entry 3866 (class 2606 OID 18967)
-- Name: bookings bookings_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- TOC entry 3867 (class 2606 OID 19002)
-- Name: bookings bookings_parent_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_parent_booking_id_fkey FOREIGN KEY (parent_booking_id) REFERENCES public.bookings(booking_id) ON DELETE SET NULL;


--
-- TOC entry 3868 (class 2606 OID 18987)
-- Name: bookings bookings_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.attraction_slots(slot_id) ON DELETE SET NULL;


--
-- TOC entry 3869 (class 2606 OID 18972)
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3876 (class 2606 OID 19139)
-- Name: cart_bookings cart_bookings_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_bookings
    ADD CONSTRAINT cart_bookings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 3877 (class 2606 OID 19134)
-- Name: cart_bookings cart_bookings_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_bookings
    ADD CONSTRAINT cart_bookings_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON DELETE CASCADE;


--
-- TOC entry 3873 (class 2606 OID 19105)
-- Name: cart_items cart_items_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE SET NULL;


--
-- TOC entry 3874 (class 2606 OID 19100)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON DELETE CASCADE;


--
-- TOC entry 3875 (class 2606 OID 19115)
-- Name: cart_items cart_items_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.attraction_slots(slot_id) ON DELETE SET NULL;


--
-- TOC entry 3872 (class 2606 OID 19070)
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3858 (class 2606 OID 18689)
-- Name: combo_attractions combo_attractions_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combo_attractions
    ADD CONSTRAINT combo_attractions_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3887 (class 2606 OID 19428)
-- Name: combos combos_attraction_1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_attraction_1_id_fkey FOREIGN KEY (attraction_1_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3888 (class 2606 OID 19433)
-- Name: combos combos_attraction_2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_attraction_2_id_fkey FOREIGN KEY (attraction_2_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3878 (class 2606 OID 19171)
-- Name: coupons coupons_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE SET NULL;


--
-- TOC entry 3882 (class 2606 OID 19314)
-- Name: happy_hours happy_hours_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.happy_hours
    ADD CONSTRAINT happy_hours_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON DELETE CASCADE;


--
-- TOC entry 3880 (class 2606 OID 19276)
-- Name: notifications notifications_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 3881 (class 2606 OID 19271)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3859 (class 2606 OID 18787)
-- Name: offer_rules offer_rules_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.offer_rules
    ADD CONSTRAINT offer_rules_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(offer_id) ON DELETE CASCADE;


--
-- TOC entry 3862 (class 2606 OID 18917)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3885 (class 2606 OID 19380)
-- Name: payment_txn_logs payment_txn_logs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.payment_txn_logs
    ADD CONSTRAINT payment_txn_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 3886 (class 2606 OID 19385)
-- Name: payment_txn_logs payment_txn_logs_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.payment_txn_logs
    ADD CONSTRAINT payment_txn_logs_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON DELETE SET NULL;


--
-- TOC entry 3853 (class 2606 OID 18548)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- TOC entry 3854 (class 2606 OID 18543)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 3855 (class 2606 OID 18573)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 3856 (class 2606 OID 18568)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4132 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: root
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 300
-- Name: FUNCTION citextin(cstring); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citextin(cstring) TO root;


--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 301
-- Name: FUNCTION citextout(public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citextout(public.citext) TO root;


--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 302
-- Name: FUNCTION citextrecv(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citextrecv(internal) TO root;


--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 303
-- Name: FUNCTION citextsend(public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citextsend(public.citext) TO root;


--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 969
-- Name: TYPE citext; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TYPE public.citext TO root;


--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 305
-- Name: FUNCTION citext(boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext(boolean) TO root;


--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 304
-- Name: FUNCTION citext(character); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext(character) TO root;


--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 306
-- Name: FUNCTION citext(inet); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext(inet) TO root;


--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 313
-- Name: FUNCTION citext_cmp(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_cmp(public.citext, public.citext) TO root;


--
-- TOC entry 4143 (class 0 OID 0)
-- Dependencies: 307
-- Name: FUNCTION citext_eq(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_eq(public.citext, public.citext) TO root;


--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 312
-- Name: FUNCTION citext_ge(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_ge(public.citext, public.citext) TO root;


--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 311
-- Name: FUNCTION citext_gt(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_gt(public.citext, public.citext) TO root;


--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 314
-- Name: FUNCTION citext_hash(public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_hash(public.citext) TO root;


--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 344
-- Name: FUNCTION citext_hash_extended(public.citext, bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_hash_extended(public.citext, bigint) TO root;


--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 316
-- Name: FUNCTION citext_larger(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_larger(public.citext, public.citext) TO root;


--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 310
-- Name: FUNCTION citext_le(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_le(public.citext, public.citext) TO root;


--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 309
-- Name: FUNCTION citext_lt(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_lt(public.citext, public.citext) TO root;


--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 308
-- Name: FUNCTION citext_ne(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_ne(public.citext, public.citext) TO root;


--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 343
-- Name: FUNCTION citext_pattern_cmp(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_pattern_cmp(public.citext, public.citext) TO root;


--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 342
-- Name: FUNCTION citext_pattern_ge(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_pattern_ge(public.citext, public.citext) TO root;


--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 341
-- Name: FUNCTION citext_pattern_gt(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_pattern_gt(public.citext, public.citext) TO root;


--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 340
-- Name: FUNCTION citext_pattern_le(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_pattern_le(public.citext, public.citext) TO root;


--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 339
-- Name: FUNCTION citext_pattern_lt(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_pattern_lt(public.citext, public.citext) TO root;


--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 315
-- Name: FUNCTION citext_smaller(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.citext_smaller(public.citext, public.citext) TO root;


--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 325
-- Name: FUNCTION regexp_match(string public.citext, pattern public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_match(string public.citext, pattern public.citext) TO root;


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 326
-- Name: FUNCTION regexp_match(string public.citext, pattern public.citext, flags text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_match(string public.citext, pattern public.citext, flags text) TO root;


--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 327
-- Name: FUNCTION regexp_matches(string public.citext, pattern public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_matches(string public.citext, pattern public.citext) TO root;


--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 328
-- Name: FUNCTION regexp_matches(string public.citext, pattern public.citext, flags text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_matches(string public.citext, pattern public.citext, flags text) TO root;


--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 329
-- Name: FUNCTION regexp_replace(string public.citext, pattern public.citext, replacement text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_replace(string public.citext, pattern public.citext, replacement text) TO root;


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 330
-- Name: FUNCTION regexp_replace(string public.citext, pattern public.citext, replacement text, flags text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_replace(string public.citext, pattern public.citext, replacement text, flags text) TO root;


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 331
-- Name: FUNCTION regexp_split_to_array(string public.citext, pattern public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_split_to_array(string public.citext, pattern public.citext) TO root;


--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 332
-- Name: FUNCTION regexp_split_to_array(string public.citext, pattern public.citext, flags text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_split_to_array(string public.citext, pattern public.citext, flags text) TO root;


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 333
-- Name: FUNCTION regexp_split_to_table(string public.citext, pattern public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_split_to_table(string public.citext, pattern public.citext) TO root;


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 334
-- Name: FUNCTION regexp_split_to_table(string public.citext, pattern public.citext, flags text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.regexp_split_to_table(string public.citext, pattern public.citext, flags text) TO root;


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 336
-- Name: FUNCTION replace(public.citext, public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.replace(public.citext, public.citext, public.citext) TO root;


--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 337
-- Name: FUNCTION split_part(public.citext, public.citext, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.split_part(public.citext, public.citext, integer) TO root;


--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 335
-- Name: FUNCTION strpos(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strpos(public.citext, public.citext) TO root;


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 321
-- Name: FUNCTION texticlike(public.citext, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticlike(public.citext, text) TO root;


--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 317
-- Name: FUNCTION texticlike(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticlike(public.citext, public.citext) TO root;


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 322
-- Name: FUNCTION texticnlike(public.citext, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticnlike(public.citext, text) TO root;


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 318
-- Name: FUNCTION texticnlike(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticnlike(public.citext, public.citext) TO root;


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 323
-- Name: FUNCTION texticregexeq(public.citext, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticregexeq(public.citext, text) TO root;


--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 319
-- Name: FUNCTION texticregexeq(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticregexeq(public.citext, public.citext) TO root;


--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 324
-- Name: FUNCTION texticregexne(public.citext, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticregexne(public.citext, text) TO root;


--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 320
-- Name: FUNCTION texticregexne(public.citext, public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.texticregexne(public.citext, public.citext) TO root;


--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 338
-- Name: FUNCTION translate(public.citext, public.citext, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.translate(public.citext, public.citext, text) TO root;


--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 1105
-- Name: FUNCTION max(public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.max(public.citext) TO root;


--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 1104
-- Name: FUNCTION min(public.citext); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.min(public.citext) TO root;


--
-- TOC entry 2334 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO root;


--
-- TOC entry 2336 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO root;


--
-- TOC entry 2335 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO root;


--
-- TOC entry 2333 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO root;


-- Completed on 2025-12-03 18:06:19

--
-- PostgreSQL database dump complete
--

\unrestrict ub1mvyWF4xWOsz6Os80afZWGxJV7uRyrPBnKcfOGI87UF1zwpe6oZBZc7MyGyMM

