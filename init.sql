--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking (
    "bookingId" bigint NOT NULL,
    "offerId" bigint,
    "userId" bigint,
    personen bigint,
    raum bigint,
    gewicht bigint,
    buchungsdatum character varying,
    preis bigint
);


ALTER TABLE public.booking OWNER TO postgres;

--
-- Name: booking_bookingId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."booking_bookingId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."booking_bookingId_seq" OWNER TO postgres;

--
-- Name: booking_bookingId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."booking_bookingId_seq" OWNED BY public.booking."bookingId";


--
-- Name: car; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.car (
    "carId" integer NOT NULL,
    marke character varying,
    modell character varying,
    sitze bigint,
    stauraum bigint,
    maxgewicht bigint,
    verbrauch bigint,
    tueren bigint,
    farbe character varying,
    "userId" bigint,
    sonderfunktion character varying
);


ALTER TABLE public.car OWNER TO postgres;

--
-- Name: car_carId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."car_carId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."car_carId_seq" OWNER TO postgres;

--
-- Name: car_carId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."car_carId_seq" OWNED BY public.car."carId";


--
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offers (
    "offerId" bigint NOT NULL,
    "userId" bigint,
    "carId" bigint,
    "startOrt" character varying,
    "zielOrt" character varying,
    "startZeit" character varying,
    sitze bigint,
    stauraum bigint,
    preisperson bigint,
    status character varying,
    "erstellungsDatum" character varying,
    maxgewicht bigint,
    preisraum bigint,
    preisgewicht bigint
);


ALTER TABLE public.offers OWNER TO postgres;

--
-- Name: offers_offerId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."offers_offerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."offers_offerId_seq" OWNER TO postgres;

--
-- Name: offers_offerId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."offers_offerId_seq" OWNED BY public.offers."offerId";


--
-- Name: searchs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.searchs (
    "searchId" bigint NOT NULL,
    "userId" bigint,
    "startOrt" character varying,
    "zielOrt" character varying,
    "startDatum" character varying,
    personen bigint,
    raum bigint,
    gewicht bigint,
    "erstellDatum" character varying,
    status character varying
);


ALTER TABLE public.searchs OWNER TO postgres;

--
-- Name: searchs_searchId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."searchs_searchId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."searchs_searchId_seq" OWNER TO postgres;

--
-- Name: searchs_searchId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."searchs_searchId_seq" OWNED BY public.searchs."searchId";


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    "userId" integer NOT NULL,
    vorname character varying,
    nachname character varying,
    email character varying,
    passwort character varying,
    handynummer bigint,
    tag bigint,
    monat bigint,
    jahr bigint,
    bewertung bigint,
    benutzername character varying,
    geld bigint
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_userId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."user_userId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."user_userId_seq" OWNER TO postgres;

--
-- Name: user_userId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."user_userId_seq" OWNED BY public."user"."userId";


--
-- Name: booking bookingId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking ALTER COLUMN "bookingId" SET DEFAULT nextval('public."booking_bookingId_seq"'::regclass);


--
-- Name: car carId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.car ALTER COLUMN "carId" SET DEFAULT nextval('public."car_carId_seq"'::regclass);


--
-- Name: offers offerId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers ALTER COLUMN "offerId" SET DEFAULT nextval('public."offers_offerId_seq"'::regclass);


--
-- Name: searchs searchId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.searchs ALTER COLUMN "searchId" SET DEFAULT nextval('public."searchs_searchId_seq"'::regclass);


--
-- Name: user userId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN "userId" SET DEFAULT nextval('public."user_userId_seq"'::regclass);


--
-- Data for Name: booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking ("bookingId", "offerId", "userId", personen, raum, gewicht, buchungsdatum, preis) FROM stdin;
17	10	1	1	1	1	2023-12-29	60
18	10	1	3	9	0	2023-12-29	210
19	10	1	2	5	4	2023-12-29	240
\.


--
-- Data for Name: car; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.car ("carId", marke, modell, sitze, stauraum, maxgewicht, verbrauch, tueren, farbe, "userId", sonderfunktion) FROM stdin;
9	A	B	2	4	5	1	3	C	2	TEST
10	TEST	test	2	4	5	1	3	test	2	TEEEST
11	A	B	2	4	5	1	3	C	3	De
12	Audio	Q7	5	4	3000	7	5	Schwarz	3	Keine
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offers ("offerId", "userId", "carId", "startOrt", "zielOrt", "startZeit", sitze, stauraum, preisperson, status, "erstellungsDatum", maxgewicht, preisraum, preisgewicht) FROM stdin;
10	3	12	Berlin	Köln	2024-01-02	-2	-5	10	offen	2023-12-29	2989	20	30
\.


--
-- Data for Name: searchs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.searchs ("searchId", "userId", "startOrt", "zielOrt", "startDatum", personen, raum, gewicht, "erstellDatum", status) FROM stdin;
1	1	Lennestadt	Köln	2023-12-29	2	2	100	2023-12-28	offen
2	3	Düsseldorf	Berlin	2023-12-31	3	1	2	2023-12-28	offen
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" ("userId", vorname, nachname, email, passwort, handynummer, tag, monat, jahr, bewertung, benutzername, geld) FROM stdin;
2	Fred	Jindra	fred.jindra@t-online.de	test	1735432177	1	1	1900	0	testtest	500
3	Philipp	Jindra	philipp-jindra@t-online.de	test	15124128694	1	2	1999	0	Philipp	5000
1	test	test	test@w	test	123	12	12	12	0	test	9200
\.


--
-- Name: booking_bookingId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."booking_bookingId_seq"', 19, true);


--
-- Name: car_carId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."car_carId_seq"', 13, true);


--
-- Name: offers_offerId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."offers_offerId_seq"', 10, true);


--
-- Name: searchs_searchId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."searchs_searchId_seq"', 2, true);


--
-- Name: user_userId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."user_userId_seq"', 3, true);


--
-- Name: booking booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT booking_pkey PRIMARY KEY ("bookingId");


--
-- Name: car car_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.car
    ADD CONSTRAINT car_pkey PRIMARY KEY ("carId");


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY ("offerId");


--
-- Name: searchs searchs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.searchs
    ADD CONSTRAINT searchs_pkey PRIMARY KEY ("searchId");


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY ("userId");


--
-- Name: offers carId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "carId" FOREIGN KEY ("carId") REFERENCES public.car("carId") NOT VALID;


--
-- Name: booking offerId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT "offerId" FOREIGN KEY ("offerId") REFERENCES public.offers("offerId") NOT VALID;


--
-- Name: car userId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.car
    ADD CONSTRAINT "userId" FOREIGN KEY ("userId") REFERENCES public."user"("userId") NOT VALID;


--
-- Name: offers userId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "userId" FOREIGN KEY ("userId") REFERENCES public."user"("userId") NOT VALID;


--
-- Name: searchs userId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.searchs
    ADD CONSTRAINT "userId" FOREIGN KEY ("userId") REFERENCES public."user"("userId") NOT VALID;


--
-- Name: booking userId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT "userId" FOREIGN KEY ("userId") REFERENCES public."user"("userId") NOT VALID;


--
-- PostgreSQL database dump complete
--

