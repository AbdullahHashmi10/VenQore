# Module Separation: Expectation vs Reality

## 1. What I Thought (The Goal)
* Every single feature (~250 to 260+) should be a completely independent, separate building block.
* No forced grouping. A user can select *just* POS and Products, without being forced to take Accounting, Inventory, Payments, or Taxes.
* Every single report should be selectable individually (e.g., a user can pick just the Profit & Loss statement, and ignore the rest).
* **The Main Missing Piece:** We need a strict "Rulebook" that defines exactly what goes with what. For example, if a user does not have Customers and Suppliers, the system should automatically know they cannot select reports related to Customers and Suppliers. This Rulebook is the core thing we need to build.
* Complete freedom to mix and match down to the smallest feature level.

## 2. How It Actually Is Right Now
* **Not fully separated.** The system is built as a traditional ERP where the core engine is woven together.
* **The core features are permanently tied together.** Right now, the code forces POS, Products, Accounting, Inventory, Customers, Taxes, and Payments to operate as one inseparable block. You cannot run the current POS without the system automatically touching the Accounting and Inventory code behind the scenes.
* **Only 30-38 surface modules are separate.** Only larger add-on features (like Manufacturing, Purchase Orders, or B2B Proposals) can currently be turned on or off.
* **Reports are grouped, not individual.** You cannot currently pick and choose individual reports; they are tied to larger module blocks.
* **No dynamic Rulebook exists.** There is no underlying system right now that automatically hides the "Customer Report" just because the "Customer" module is turned off.

## 3. What We Need, What We Don't Have, and What We Haven't Thought About
* **Redefining Billing:** The entire billing model needs to be rethought to match this new system. 
* **The Problem:** Previously, we charged based on fixed "Plans". But if every single feature and report is its own independent building block, a fixed plan no longer makes sense.
* **The Unanswered Question:** How do we charge now? Do we charge based on usage? Based on each specific module they activate? Based on the number of users/staff? We have not thought this through yet, and we are lacking a clear strategy for it. We need to be very sure about how this will work.
* **Landing Page Positioning:** We need to update our main landing page copy to reflect this new "build your own software" model. 
* **Managing Expectations:** The copy must clearly communicate that right now, they can *only* build software for specific types of businesses (we don't support every business type yet). We need to sell what we have now while teasing what we will offer in the future, making it clear that early adopters can expand their system later (depending on the final billing rules).
* **The 150+ Metric Cards:** I was actually referring to the 150+ contextual metric cards we designed for the top of every listing page (e.g., Invoices list, Purchases list), not just the main overview dashboard.
* **The Reality of Cards:** While we planned 150+ of these metrics across all pages in our new positioning designs, the current coded backend only supports 20 main dashboard cards (`DashboardRegistry.php`). The 150+ contextual metrics are not yet built as customizable components.
* **The Decision for Now:** Instead of delaying launch to build a massive system where users can drag, drop, and customize all 150+ metric cards across every single page, we will just rename and reposition what we currently have to match their business type.
* **The Future Plan for Cards:** In the future, we will introduce a new UI that allows users to add, rearrange, and resize these extra metric cards on their listing pages for total customization. For now, we ship what we have.
* **The Reckoner Data Engine:** We have already created the "Reckoner" engine, which was built specifically to fetch and display the data for all these different metric cards. We need a clear decision on whether we are integrating and using the Reckoner right now, or if it is part of the future plan.
* **Pushback on the Audit (The Dashboard Builder):** The AI Builder Master Map told us to freeze the "Composable Dashboard Builder" because the existing system is "sufficient". **I disagree.** If you look at the current Manager dashboard, the layout is a complete mess (things are overlapping and it looks very bad). If the current system cannot properly manage dashboard layouts for just 7 user roles, it will completely fail to manage 40+ business types and thousands of capabilities. We *need* a dynamic layout system that can handle all these possibilities cleanly.
* **UI Customization (Themes & Colors):** I was considering letting users customize the software with different colors, themes, and new "bklit" charts and cards right away.
* **The Decision on UI:** We should hold off on this for the initial launch. We will go with the current UI to get the product out faster, and roll out the new visual customizations (bklit components, custom colors, new looks) as major features in future updates. This gives users something exciting to look forward to and keeps our launch timeline tight.

## 4. What We Should Do
* [Fill in your plan here]
* 
* 
* 
