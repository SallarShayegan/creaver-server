--
-- PostgreSQL database dump
--

-- Dumped from database version 11.8
-- Dumped by pg_dump version 11.8

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

SET default_with_oids = false;

--
-- Name: music; Type: TABLE; Schema: public; Owner: sallar
--

CREATE TABLE public.music (
    id character varying,
    artist_id character varying,
    likes character varying[] DEFAULT '{}'::character varying[],
    plays integer DEFAULT 0,
    bpm integer,
    sharing_date character varying,
    data jsonb,
    next_id character varying[],
    comments jsonb[] DEFAULT '{}'::jsonb[]
);


ALTER TABLE public.music OWNER TO sallar;

--
-- Name: people; Type: TABLE; Schema: public; Owner: sallar
--

CREATE TABLE public.people (
    id character varying,
    password character varying,
    tracks character varying[] DEFAULT '{}'::text[],
    followers character varying[] DEFAULT '{}'::character varying[],
    following character varying[] DEFAULT '{}'::character varying[],
    likes character varying[] DEFAULT '{}'::character varying[],
    username character varying,
    reg_date character varying,
    profile_data jsonb
);


ALTER TABLE public.people OWNER TO sallar;

--
-- Data for Name: music; Type: TABLE DATA; Schema: public; Owner: sallar
--

COPY public.music (id, artist_id, likes, plays, bpm, sharing_date, data, next_id, comments) FROM stdin;
track_620782183402117	person2834476507	{person5243758225,person1768482880,person2834476507,person2107355023}	0	\N	1563483375618	{"name": "Ich hab Bock", "genre": "Techno", "place": "Darmstadt", "discription": ""}	\N	{}
track_775221843428607	person3572827522	{person3572827522,person2834476507,person1768482880}	0	\N	1563744747125	{"name": "test2", "genre": "test", "place": "test", "discription": "test"}	\N	{}
track_744844563104647	person3572827522	{person3572827522,person2834476507,person1768482880}	0	\N	1563744687445	{"name": "test", "genre": "test", "place": "test", "discription": "test"}	\N	{}
track_781308446605325	person1768482880	{}	0	\N	1590780123644	{"name": "bla", "genre": "", "place": "", "discription": "please, this is a nice track:S"}	\N	{}
track_434087878025163	person5168527583	{person2834476507}	0	\N	1563705786687	{"name": "test", "genre": "tes", "place": "test", "discription": "test"}	[0:1]={track_134071174818746,track_814034353147181}	{}
track_248084740811011	person2834476507	{}	0	\N	1590705305332	{"name": "Berlin1.2", "genre": "Techno", "place": "Berlin", "discription": "fucked up vibes"}	\N	{}
track_233643212546062	person2834476507	{person5168527583,person3572827522,person5243758225,person1768482880,person2834476507,person2107355023}	0	\N	1561328997424	{"name": "Psilocybin", "genre": "TechHouse", "place": "", "discription": ""}	\N	{}
track_386102056110314	person2834476507	{}	0	\N	1590776956425	{"name": "Kirchheim ut. Teckno", "genre": "", "place": "", "discription": ""}	\N	{}
track_731320064554163	person2834476507	{person2107355023}	0	\N	1564614303352	{"name": "New you", "genre": "Electronic", "place": "Darmstadt", "discription": "the new you"}	\N	{}
track_878325625884372	person1768482880	{}	1	\N	1590780249309	{"name": "noises", "genre": "", "place": "", "discription": ""}	\N	{}
track_856882363758864	person1768482880	{person1768482880,person4465565282}	0	\N	1590779988465	{"name": "harsh", "genre": "", "place": "", "discription": ""}	\N	{}
track_814034353147181	person2107355023	{}	0	\N	1588582204855	{"name": "Batwings Rise", "genre": "Electro", "place": "Netherlands", "discription": "no descr."}	\N	{"{\\"id\\": 0, \\"date\\": 1594031534678, \\"text\\": \\"track id please\\", \\"seconds\\": 0, \\"writer_id\\": \\"person2834476507\\"}","{\\"id\\": 1, \\"date\\": 1594031572893, \\"text\\": \\"fuck yaaall\\", \\"seconds\\": 0, \\"writer_id\\": \\"person1768482880\\"}"}
track_134071174818746	person2834476507	{person3572827522,person5168527583,person5243758225,person1768482880,person2107355023,person2834476507}	0	\N	1561229755699	{"name": "Implements", "genre": "Ambient", "place": "Darmstadt", "discription": "three implements"}	{}	{}
\.


--
-- Data for Name: people; Type: TABLE DATA; Schema: public; Owner: sallar
--

COPY public.people (id, password, tracks, followers, following, likes, username, reg_date, profile_data) FROM stdin;
person2107355023	$2b$10$IqhiDUIAKnrxxx8.eVAYEeMilE/RlV72DZJeUCwkJV5Tb0G4LYARK	{track_814034353147181}	{person4204575562,person1768482880,person5168527583,person5243758225,person4384277854}	{person3572827522,person5168527583,person1768482880,person2834476507,person4204575562}	{track_134071174818746,track_233643212546062,track_620782183402117,track_731320064554163}	batwing	1561417453257	{"bio": "", "city": "Athen", "name": "Batwing Ben", "email": "batwing@test.com", "phone": "", "country": "Griece", "hasImage": false, "username": "batwing", "birth_date": ""}
person4204575562	$2b$10$0YEr5Ar6r9yRK2yrFYOKY.II2ETQZDGVMb8fElAt2dEMbNxuxcXIC	{}	{person2107355023,person1768482880,person5243758225,person4384277854}	{person5168527583,person2834476507,person2107355023}	{}	lifeless	1562795986793	{"bio": "", "city": "Würzburg", "name": "Lifeless", "email": "lifeless@test.com", "phone": "", "country": "Germany", "hasImage": false, "username": "lifeless", "birth_date": ""}
person4465565282	$2b$10$y5XgsiN6/9V9vM4HCh20Re5.azZ5yQVemjzCb0mrs5MQefOfZqdmq	{}	{}	{person3572827522,person1768482880}	{track_856882363758864}	emmanora	1593186009475	{"bio": "", "city": "", "name": "Emma Nora", "email": "emmanora@test.com", "phone": "", "country": "", "hasImage": false, "username": "emmanora", "birth_date": ""}
person3572827522	$2b$10$ZdXypnFkjqTew1Vacv9ivuydzCJLybkPG5GiEEArppIDra7iHmpm2	{track_744844563104647,track_775221843428607}	{person2107355023,person1768482880,person5168527583,person5243758225,person4384277854,person4465565282}	{person2834476507}	{track_744844563104647,track_134071174818746,track_775221843428607,track_233643212546062}	julster	1561585253841	{"bio": "", "city": "Berlin", "name": "Disorderly Julster", "email": "julster@test.com", "phone": "", "country": "Germany", "hasImage": true, "username": "julster", "birth_date": ""}
person5168527583	$2b$10$HimgWBOOtbrCOodg2et3wO.5EPnaS8MQzM6JasTvzKMT1yS9Zs9Vq	{track_434087878025163}	{person4204575562,person2107355023,person1768482880,person5243758225,person4384277854}	{person2107355023,person1768482880,person2834476507,person3572827522}	{track_134071174818746,track_233643212546062}	pappeneinnehmer	1561233830879	{"bio": "", "city": "Würzburg", "name": "Pappen Einnehmer", "email": "pappen@test.com", "phone": "", "country": "Germany", "hasImage": false, "username": "pappeneinnehmer", "birth_date": "1983-10-24"}
person4384277854	$2b$10$6tXvuB2c1yRUF5mhrGYS4.yv9XVH7j/FSBf0qtC/PjnuLfl3AOW0a	{}	{}	{person2107355023,person5168527583,person2834476507,person3572827522,person1768482880,person4204575562}	{}	salutary	1564910532364	{"bio": "", "city": "Paris", "name": "Salutary", "email": "salutary@test.com", "phone": "+49 157 434 434 66", "country": "France", "hasImage": false, "username": "salutary", "birth_date": ""}
person5243758225	$2b$10$32DI1qgGGqi1l.336d0vtuObEgVn9mWjI8NHRw4CZ13i6byk8cH4.	{}	{person1768482880}	{person2834476507,person1768482880,person2107355023,person4204575562,person3572827522,person5168527583}	{track_134071174818746,track_233643212546062,track_620782183402117}	ruefus	1564007174491	{"bio": "", "city": "", "name": "Ruefus Nova", "email": "ruefus@test.com", "phone": "", "country": "", "hasImage": false, "username": "ruefus", "birth_date": ""}
person2834476507	$2b$10$he0aX06OfDHIK1mnd35gyuIirhdSRXOyi4F82WKuC5BnAEAX1LXI2	{track_134071174818746,track_233643212546062,track_620782183402117,track_731320064554163,track_248084740811011,track_386102056110314}	{person3572827522,person2107355023,person4204575562,person1768482880,person5168527583,person5243758225,person4384277854}	{}	{track_744844563104647,track_775221843428607,track_434087878025163,track_620782183402117,track_233643212546062,track_134071174818746}	solargun	1559340000000	{"bio": "From experimental electronic to industrial techno", "city": "Darmstadt", "name": "Solargun", "email": "solargun@test.com", "phone": "+49 157 37 551 535", "country": "Germany", "hasImage": true, "username": "solargun", "birth_date": "1998-03-21"}
person1768482880	$2b$10$7bpMKQo3lxapUwI7fW8xdOJA8nx/nJr.hUWlIDkK3Oqttbz.0A6WK	{track_856882363758864,track_781308446605325,track_878325625884372}	{person2107355023,person5168527583,person5243758225,person4384277854,person4465565282}	{person4204575562,person5168527583,person2834476507,person3572827522,person2107355023,person5243758225}	{track_134071174818746,track_233643212546062,track_620782183402117,track_775221843428607,track_744844563104647,track_856882363758864}	harsh	1561588881607	{"bio": "Tracks out of noise", "city": "", "name": "Harsh Sound", "email": "harsh@test.com", "phone": "+49 111 222 333", "country": "France", "hasImage": false, "username": "harsh", "birth_date": ""}
\.


--
-- PostgreSQL database dump complete
--

