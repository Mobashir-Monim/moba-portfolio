# Projects

Prose for the project records. Keys match `Project.slug`. Feature lists are structured data and
live in `content/projects.ts`; only the narrative is here.

## billing-engine

The Billing Engine is GymRevenue's client-end billing module, covering what a gym or club charges its members for. It encompasses a comprehensive range of services, including but not limited to membership fee calculation, invoice generation, payment processing, and subscription management. This module ensures a seamless and efficient billing experience for members, enhancing their overall satisfaction while facilitating accurate and transparent financial transactions within the gym or club environment.

## point-of-sale

Point of Sale is GymRevenue's in-system till, handling transactions at the counter. It enables the seamless sale of inventory items, subscriptions, and services, catering to diverse customer needs. Additionally, the module incorporates a robust discount management feature, allowing businesses to apply various discounts or promotional offers as per their pricing strategies. This multifaceted PoS system streamlines the sales process, enhances customer service, and provides businesses with the flexibility to implement pricing and discount structures that align with their strategic objectives.

## inventory-management

Inventory Management is GymRevenue's stock module, tracking what a gym holds and where it holds it. It allows for meticulous categorization and tracking based on parameters such as location, item category, specific item, and brand. By utilizing this system, businesses can efficiently manage their inventory, optimize stock levels, and ensure the availability of the right products at the right place and time, thereby enhancing operational efficiency and customer satisfaction.

## service-agreements

Service Agreements is GymRevenue's module for defining the terms a service or a subscription is billed under. It offers businesses the capability to define, configure, and maintain the terms associated with their services and subscriptions, ensuring accuracy and consistency in billing processes. This includes specifying pricing structures, billing cycles, renewal conditions, and any other pertinent terms. By utilizing this module, businesses can enhance billing accuracy, reduce errors, and ensure that their clients receive transparent and well-structured billing statements, thereby fostering client satisfaction and operational efficiency.

## calendar-and-scheduling

Calendar and Scheduling is GymRevenue's module for classes, tasks, services, and the people booked into them. It offers the flexibility to define various event types, facilitating the scheduling and efficient management of classes, tasks, or services. Additionally, it includes comprehensive attendee management capabilities, allowing for the seamless organization and coordination of participants in these events. This module serves as a valuable tool for businesses seeking to optimize their scheduling processes, improve resource allocation, and enhance client engagement through efficient event planning and management.

## cli-dev-tool

The CLI Dev Tool generates the repetitive scaffolding for a new domain in GymRevenue's architecture from one command, cutting feature time by nearly 40%.

It is important to note that the design philosophy of this development tool prioritized security and local environment utilization. As a result, the tool was intentionally configured to execute exclusively within a local environment, precluding its operation in server environments. This approach ensured that the tool's functionality remained secure and aligned with development best practices.

## bout

Bout is a faculty evaluation and student information system for universities, covering evaluation collection, analysis, and student records. It offers a comprehensive suite of features tailored to educational institutions, enabling them to efficiently assess faculty performance, manage student data, and make data-driven decisions to improve the overall academic experience. This software empowers institutions to maintain accurate records, evaluate faculty contributions, and optimize administrative processes for enhanced educational outcomes.

## bout-v2

Bout V2 is a rebuild of Bout at feature parity with the original, plus additions. Built on the React framework and integrated with Firebase, this iteration offers a more robust and dynamic user experience. In addition to replicating the core functionality of Bout, Version 2 introduces supplementary features designed to further streamline administrative processes and provide added value to users. These enhancements collectively contribute to an elevated level of performance and usability within the software.

## busso

BuSSO is a Single Sign-On service supporting generic SAML and OpenID Connect. This comprehensive SSO system provides a secure and efficient means of authentication, catering to the diverse needs of organizations, ensuring seamless access control, and enhancing user experience across various applications and platforms.

## blober

Blober is a specialized software platform designed for the purpose of MySQL query testing. It serves as a dedicated environment for users to rigorously test and evaluate MySQL queries, enhancing database query optimization and facilitating the development of efficient database interactions. This tool empowers database professionals and developers to fine-tune their SQL queries for optimal performance and accuracy.

## lightsaml

LightSaml is a library implementing the SAML 2.0 data model, XML serialization with security and certificate support, and binding encapsulation. This is a fork of qikker-online/lightSAML.

## beep

Beep is a parking lot management and spot subscription system that reads live occupancy from IoT sensors. It is designed to seamlessly connect with IoT devices strategically placed within the parking facility, enabling real-time detection and monitoring of available parking spots. This advanced system not only streamlines parking spot allocation but also facilitates subscription management, providing a comprehensive solution for both parking operators and users.

## mongol-tori

Mongol Tori is the content management system behind Brac University's Mars rover project, developed and maintained by the ROBU club. It functions as a central hub for disseminating project-related information, research updates, and documentation. This CMS facilitates efficient content organization, enabling seamless collaboration and information sharing among project stakeholders and enthusiasts.

## land-reg

Land Reg is a prototype demonstrating the Council Protocol, a Delegated Proof of Stake consensus built for Bangladesh's land registry. It showcases the potential of this innovative technology to revolutionize and streamline land registry processes, offering greater transparency, security, and efficiency in land transactions within the country.

## ecube

Ecube is a content management system and eCommerce site for an entertainment company, selling event tickets and renting equipment. This integrated system allows users to seamlessly navigate between content management and eCommerce operations. It facilitates event ticket sales, offering a user-friendly interface for customers to browse, select, and purchase tickets for various entertainment events. Moreover, it provides robust product tracking capabilities, ensuring accurate inventory management and timely replenishment. The platform also enables equipment renting services, allowing users to conveniently rent specialized entertainment equipment. Lastly, it incorporates advanced sales analysis tools, offering valuable insights into customer behavior and overall sales trends to inform strategic decisions.

## connect

Connect is a scholarship application collection and tracking platform, from submission through evaluation to award. Applicants can easily submit their scholarship applications through a user-friendly interface, attaching required documents such as transcripts, essays, and recommendation letters. The platform offers comprehensive application tracking, providing applicants with real-time updates on the status of their submissions. It also includes secure document management, aiding administrators in the efficient evaluation of application materials. Additionally, integrated communication tools facilitate interactions between administrators and applicants. Robust scoring and evaluation mechanisms ensure a systematic approach to selecting scholarship recipients. The platform's reporting and analytics capabilities offer insights into application volume, demographics, and other pertinent data. Ultimately, this platform simplifies scholarship management for providers and enhances the experience for applicants.

## huddle

Huddle is a shift scheduling and HR system for cafes, covering rotas, attendance, payroll, and employee records. It includes shift scheduling features to efficiently assign work shifts, ensuring appropriate coverage during peak hours. Time and attendance tracking allows employees to record their hours worked accurately. Detailed employee records, including personal information, employment history, and certifications, facilitate HR processes. The system automates payroll calculations, generates pay stubs, and manages leave requests. Performance tracking and training record keeping support employee development. The platform empowers employees through self-service access to schedules, time-off requests, and pay stubs. Robust labor cost analysis tools aid in labor cost control. Compliance and reporting features ensure adherence to labor regulations and generate compliance reports as needed. Data security is a priority, safeguarding sensitive employee information.

## alfred

Alfred is a requisition management system for ready-made garment factories, from raising a request through approval to purchase order. It enables authorized personnel to create requisitions for materials, fabrics, trims, accessories, and more. Integrated with inventory management, the system provides real-time stock level information. Requisitions can undergo an automated approval workflow, ensuring appropriate reviews and approvals. Vendor integration allows for preferred supplier selection and purchase order generation. Budget tracking capabilities prevent overspending. Real-time status tracking enhances transparency and accountability. Robust reporting and analytics tools offer insights into requisition trends and budget utilization. Document management features centralize related documents, such as invoices and purchase orders. An audit trail maintains a historical record of requisition-related activities. Role-based access control ensures authorized access, and mobile accessibility may be available. The system prioritizes data security to protect sensitive information.

## user-validator

User Validator checks accounts on Brac University's OpenEdx platform against the real student and faculty rolls, removing fake sign-ups. The platform was launched during the pandemic, when nobody could be vouched for in person. This stringent validation process was instrumental in identifying and eliminating fake and scam accounts, thereby safeguarding the platform's credibility and user community. The User Validator's efforts were critical in maintaining the authenticity of the platform's user base, which is paramount for academic institutions, particularly during remote learning initiatives.

## lms-usage-report-generator

The LMS Usage Report Generator turns Google Analytics data on Brac University's OpenEdx platform into reports a non-technical reader can act on.

These reports offered a comprehensive account of how the OpenEdx LMS platform was utilized, encompassing aspects such as user engagement, content consumption, and navigation behavior. By presenting this information in an accessible format, the report generator enabled non-technical users, including educators and administrators, to gain a deep understanding of the platform's usage dynamics without the need for technical expertise.

Furthermore, this data-driven approach contributed to a more cost-effective solution. By having a clear understanding of how the platform was utilized, Brac University could make informed decisions regarding resource allocation, content optimization, and user engagement strategies. Ultimately, the LMS Usage Report Generator played a pivotal role in enhancing the efficiency and effectiveness of the OpenEdx LMS platform while ensuring cost-effectiveness in its operations.

## automated-course-management-scripts

The Automated Course Management Scripts set up each semester's courses in Brac University's LMS: creation, enrollment, materials, and instructor access. This sophisticated automation tool significantly expedited critical administrative processes.

One of its primary functions was to efficiently handle the creation and setup of courses for each academic semester. This encompassed tasks such as course creation, enrollment of students, assignment of course materials, and scheduling. By automating these processes, the management team could swiftly adapt the LMS to new academic terms, ensuring a seamless transition between semesters.

Additionally, the scripts facilitated the inclusion of instructors into the system by granting them access and enabling them to manage their course content. This not only saved time but also ensured that faculty members had the necessary tools and resources at their disposal to effectively administer their courses.

The implementation of the Automated Course Management Scripts significantly enhanced the overall efficiency of LMS management, allowing the team to focus more on strategic initiatives and less on manual administrative tasks. It played a pivotal role in improving the user experience for both students and instructors while promoting a more agile and responsive LMS environment.
